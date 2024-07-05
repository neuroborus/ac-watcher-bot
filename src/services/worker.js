const cron = require('node-cron');
const { sleep } = require('../utils/time');
const logger = require('../utils/logger');
const { HERE, PING_PATTERN} = require('../configs/watcher.config');
const { sendAlert } = require('./notifications');
const telegram = require('./telegram.bot');
const { getAvailability } = require('./status');
const {MONGO_CONNECTED} = require("../configs/mongo.config");
const {History} = require("../mongo");



let previousStatus;
let isClearingLogFiles = false;
let isPenguining = false;

function startWorker() {
  console.log('Worker started!');
  cron.schedule(PING_PATTERN, async () => {
    await penguin();
  });
  cron.schedule('0 0 * * 0', async () => {
    await clearLogFiles();
  });
}

async function checkPreviousStatus() {
  let status;
  if ( previousStatus === undefined && MONGO_CONNECTED ) {
    const obj = await History.findOne().sort({ createdAt: -1 });
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
