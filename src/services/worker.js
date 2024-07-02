const cron = require('node-cron');
const ping = require('ping');
const { sleep } = require('../utils/time');
const { HERE, PING_PATTERN} = require('../constants/watcher.constants');
const { sendAlert } = require('./notifications');
const telegram = require('./telegram.bot');
const logger = require('../utils/logger');
const { notifyAboutStatus } = require('./telegram.bot');
const { PINGING_HOST } = process.env;


let previousStatus;
let isClearingLogFiles = false;

function startWorker () {
  console.log('Worker started!');
  cron.schedule(PING_PATTERN, async () => {
    await penguin();
  });
  cron.schedule('0 0 * * 0', async () => {
    await clearLogFiles();
  });
}


async function penguin() {
  const status = await ping.promise.probe(PINGING_HOST);

  console.trace('Current status -> ' + (status ? 'on' : 'off'));
  if (status.alive !== previousStatus) {
    previousStatus = status.alive;
    console.trace('Notifying...');
    await notifyAboutStatus(status.alive);
    console.trace('Notified!');
  }
}

async function clearLogFiles() {
  if (isClearingLogFiles) {
    console.warn(
      new Date().toISOString() +
      ': processLogs() -=> skip: already processing!'
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
