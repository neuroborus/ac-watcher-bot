const dotenv = require('dotenv');
dotenv.config();

const {HERE} = require('./configs/watcher.config');
const telegram = require('./services/telegram');
const {startWorker} = require('./services/worker');
const {
    sendAlert,
    sendInfo
} = require('./services/notifications');
const logger = require('./utils/logger');
const {MONGO_CONNECTED} = require('./configs/mongo.config');
const {connectMongo} = require('./mongo');

//

async function start() {
    await logger.inject();
    telegram.service.startBot();
    if (MONGO_CONNECTED) await connectMongo();
    await sendInfo('Started!', HERE);
    startWorker();
}

start().catch(e => {
    console.error(e);
    sendAlert(HERE, e).then(r => r);
});
