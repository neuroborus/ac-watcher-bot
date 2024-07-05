const dotenv = require('dotenv');
dotenv.config();

const { HERE } = require('./configs/watcher.config');
const { startBot } = require('./services/telegram.bot');
const { startWorker } = require('./services/worker');
const {
  sendAlert,
  sendInfo
} = require('./services/notifications');
const logger = require('./utils/logger');
//

async function start () {
  await logger.inject();
  startBot();
  await sendInfo('Started!', HERE);
  startWorker();
}

start().catch(e => {
  console.error(e);
  sendAlert(HERE, e).then(r => r);
});
