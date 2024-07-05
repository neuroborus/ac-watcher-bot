const cron = require('node-cron');
const { sleep } = require('../utils/time');
const logger = require('../utils/logger');
const { HERE, PING_PATTERN} = require('../configs/watcher.config');
const { sendAlert } = require('./notifications');
const telegram = require('./telegram.bot');
const { getAvailability } = require('./status');



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
  const isAvailable = await getAvailability();

  console.trace('Current status -> ' + (isAvailable ? 'on' : 'off'));

  if (previousStatus === undefined) {
    previousStatus = isAvailable;
  } else if (isAvailable !== previousStatus) {
    previousStatus = isAvailable;
    console.trace('Notifying...');
    await telegram.notifyAboutStatus(isAvailable);
    console.trace('Notified!');
  }
}

async function clearLogFiles() {
  if (isClearingLogFiles) {
    console.warn(
      new Date().toISOString() +
      ': clearLogFiles() -=> skip: already processing!'
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
