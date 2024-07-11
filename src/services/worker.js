const cron = require('node-cron');
const time = require('../utils/time');
const logger = require('../utils/logger');
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
        await generateStatisticsAndSendGraph(time.maximizedYesterday());
    });
}

async function generateStatisticsAndSendGraph(nowDate) {
    try {
        // !: Heavy operations -> one-by-one
        const weekFile = await history.generateStatisticsAndGetGraph(SAMPLE.WEEK, nowDate);
        const monthFile = await history.generateStatisticsAndGetGraph(SAMPLE.MONTH, nowDate);
        const files = [weekFile, monthFile];
        await telegram.service.photosToChannel(files)
        await telegram.service.photosToUsers(files);
    } catch (err) {
        await notifications.sendAlert(`generateStatisticsAndSendGraph() -=> ${err}`, WHERE);
    }
}

/////////////////////////////

async function penguin() {
    if (isPenguining) {
        console.warn('penguin is already running!');
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
