const cron = require('node-cron');
const {sleep, weekInMs, maximizeDate, daysInMonth, daysInMs} = require('../utils/time');
const logger = require('../utils/logger');
const {HERE, PING_PATTERN, EVERY_WEEK_PATTERN, EVERY_MONTH_PATTERN} = require('../configs/watcher.config');
const {sendAlert} = require('./notifications');
const telegram = require('./telegram.bot');
const {getAvailability} = require('./status');
const {MONGO_CONNECTED} = require('../configs/mongo.config');
const {History} = require('../mongo');
const {generateAndGetGraph} = require('./graph.service');


let previousStatus;
let isClearingLogFiles = false;
let isPenguining = false;

function startWorker() {
    console.log('Worker started!');
    cron.schedule(PING_PATTERN, async () => {
        await penguin();
    });
    cron.schedule(EVERY_WEEK_PATTERN, async () => {
        await clearLogFiles();
        let date = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes
        await sendGraphStatistics(
            'week',
            maximizeDate(date)
        );
    });
    cron.schedule(EVERY_MONTH_PATTERN, async () => {
        await sleep(10000); // 10 sec
        let date = new Date(Date.now() - 1000 * 60 * 15); // 15 minutes
        await sendGraphStatistics(
            'month',
            maximizeDate(date)
        );
    });
}

async function sendGraphStatistics(type, nowDate) {
    try {
        const file = await generateAndGetGraph(type, nowDate)
        await telegram.photoToChannel(file);
    } catch (err) {
        console.error(err);
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
        const isAvailable = await getAvailability();

        console.trace('Current status -> ' + (isAvailable ? 'on' : 'off'));

        const previous = await checkPreviousStatus();

        if (previous === undefined) {
            previousStatus = isAvailable;
            await sendToDbIfEnabled(isAvailable)
            console.trace('Sent to db!');
        } else if (isAvailable !== previous) {
            previousStatus = isAvailable;
            console.trace('Notifying...');
            await telegram.notifyAboutStatus(isAvailable);
            console.trace('Notified!');
            await sendToDbIfEnabled(isAvailable)
        }
    } catch (err) {
        console.error(err);
    }
    isPenguining = false;
}

async function checkPreviousStatus() {
    let status;
    if (previousStatus === undefined && MONGO_CONNECTED) {
        const obj = await History.findOne().sort({createdAt: -1});
        status = obj?.isAvailable;
    } else {
        status = previousStatus;
    }
    return status;
}

async function sendToDbIfEnabled(isAvailable) {
    if (MONGO_CONNECTED) {
        await History.create({isAvailable});
        console.trace('Sent to db!');
    }
}

///////////////////////////////////

async function clearLogFiles() {
    if (isClearingLogFiles) {
        console.warn(
            'clearLogFiles() -=> skip: already processing!'
        );
        return;
    }

    console.trace(
        'clearLogFiles() -=> started!'
    );

    try {
        await telegram.infoAdmin(
            'Sending #backup of inner logs before deleting...',
            HERE,
            'INFO'
        );
        await telegram.sendLogFile('logs');

        logger.clearLogs();
        await sleep(5000); // Wait until fs will sync

    } catch (e) {
        await sendAlert('clearLogFiles() -=> ' + e, HERE);
    } finally {
        isClearingLogFiles = false;
        console.trace(
            'clearLogFiles() -=> ended!'
        );
    }
}

module.exports = {
    startWorker
};
