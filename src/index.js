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
const { MONGO_CONNECTED } = require('./configs/mongo.config');
const { connectMongo } = require('./mongo');
const {plot} = require("./services/graph-plotter");
//

async function start () {
  await plot();
  await logger.inject();
  startBot();
  if (MONGO_CONNECTED) await connectMongo();
  await sendInfo('Started!', HERE);
  startWorker();
}

start().catch(e => {
  console.error(e);
  sendAlert(HERE, e).then(r => r);
});
