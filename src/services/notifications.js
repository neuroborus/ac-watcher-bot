const telegram = require('./telegram');
const notifications = require('../configs/notifications.config');

async function sendAlert(message, env, level = notifications.LEVEL.ALERT, logUrl = '') {
    const promises = [];
    promises.push(telegram.informing.alertAdmin(message, env, level, logUrl));

    await Promise.allSettled(promises);
}

async function sendInfo(message, env, level = notifications.LEVEL.INFO, logUrl = '') {
    const promises = [];
    promises.push(telegram.informing.infoAdmin(message, env, level, logUrl));

    await Promise.allSettled(promises);
}

module.exports = {
    sendAlert,
    sendInfo
};
