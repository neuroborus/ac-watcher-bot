const ping = require('ping');
const { PINGING_HOST } = process.env;

async function getAvailability() {
    const status = await ping.promise.probe(PINGING_HOST);
    return status.alive;
}


module.exports = {
    getAvailability
};