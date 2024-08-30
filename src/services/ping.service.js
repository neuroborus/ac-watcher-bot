const ping = require('ping');
const {PING_TIMEOUT_SEC} = require('../configs/watcher.config');
const {PINGING_HOST} = process.env;

async function getAvailability() {
    const status = await ping.promise.probe(PINGING_HOST, {
        timeout: PING_TIMEOUT_SEC
    });
    return status.alive;
}

module.exports = {
    getAvailability
};