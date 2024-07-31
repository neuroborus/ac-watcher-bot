const cron = require('node-cron');
const time = require('../tools/time');
const logger = require('../tools/logger');
const watcher = require('../configs/watcher.config');
const notifications= require('./notifications');
const telegram = require('./telegram');
const ping = require('./ping.service');
const mongo = require('./mongo.service');
const history = require('./history');

const {MONGO_CONNECTED} = require('../configs/mongo.config');
const {SAMPLE} = require('../configs/history.config');

const WHERE = 'Worker';

let previousStatus;
let isClearingLogFiles = false;
let isPenguining = false;

function startWorker() {
    console.log('Worker started!');
    cron.schedule(watcher.PING_PATTERN, async () => {
        await penguin();
    });
    cron.schedule(watcher.EVERY_WEEK_PATTERN, async () => {
        // Actualize data for predictions and send graphs
        await clearLogFiles();
        if (!MONGO_CONNECTED) return;
        await graphDelivery(SAMPLE.WEEK);
    });

    cron.schedule(watcher.EVERY_MONTH_PATTERN, async () => {
        if (!MONGO_CONNECTED) return;
        await graphDelivery(SAMPLE.MONTH);
    });
}

async function graphDelivery(type) {
    try {
        console.trace('graphDelivery() started!');
        const file = await history.createGraph(type, time.maximizedYesterday());
        await telegram.service.photoToChannel(file)
        await telegram.service.photoToUsers(file);
    } catch (err) {
        await notifications.sendAlert(`graphDelivery() -=> ${err}`, WHERE);
    }
}

/////////////////////////////

async function penguin() {
    if (isPenguining) {
        console.warn('penguin() is already running!');
        return;
    }
    const now = new Date();
    if (watcher.SKIP_TIME.some(({HOUR, MINUTE}) =>
        now.getHours() === HOUR && now.getMinutes() === MINUTE)) {
        console.trace('penguin() -=> skip by SKIP_TIME!');
        return;
    }
    isPenguining = true;
    try {
        const isAvailable = await ping.getAvailability();

        console.trace('Current status -> ' + (isAvailable ? 'on' : 'off'));

        const previous = await checkPreviousStatus();

        if (previous === undefined) {
            previousStatus = isAvailable;
            await mongo.createHistory(isAvailable)
            console.trace('Sent to db!');
        } else if (isAvailable !== previous) {
            previousStatus = isAvailable;
            console.trace('Notifying...');
            await telegram.service.notifyAboutStatus(isAvailable);
            console.trace('Notified!');
            await mongo.createHistory(isAvailable)
        }
    } catch (err) {
        await notifications.sendAlert(`penguin() -=> ${err}`, WHERE);
    }
    isPenguining = false;
}

async function checkPreviousStatus() {
    let status;
    if (previousStatus === undefined) {
        const obj = await mongo.getLastHistory();
        status = obj?.isAvailable;
    } else {
        status = previousStatus;
    }
    return status;
}

///////////////////////////////////

async function clearLogFiles() {
    if (isClearingLogFiles) {
        console.warn('clearLogFiles() -=> skip: already processing!');
        return;
    }

    console.trace('clearLogFiles() -=> started!');

    try {
        await notifications.sendInfo('Sending #backup of inner logs before deleting...', WHERE);
        await telegram.service.logsToAdmin('logs');

        logger.clearLogs();
        await time.sleep(5000); // Wait until fs will sync

    } catch (err) {
        await notifications.sendAlert(`clearLogFiles() -=> ${err}`, WHERE);
    } finally {
        isClearingLogFiles = false;
        console.trace('clearLogFiles() -=> ended!');
    }
}

module.exports = {
    startWorker
};
