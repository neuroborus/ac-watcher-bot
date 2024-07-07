const dotenv = require('dotenv');
dotenv.config();

const {HERE} = require('./configs/watcher.config');
const logger = require('./utils/logger');
const telegram = require('./services/telegram');
const worker = require('./services/worker');
const notifications = require('./services/notifications');
const mongo = require('./services/mongo.service');

//

async function start() {
    await logger.inject();
    telegram.service.startBot();
    await mongo.connectToMongo();
    await notifications.sendInfo('Started!', HERE);
    worker.startWorker();
}

start().catch(e => {
    console.error(e);
    notifications.sendAlert(HERE, e).then(r => r);
});
