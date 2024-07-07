const telegram = require('./telegram');

async function sendAlert(message, env, level = 'ALERT', logUrl = '') {
    const promises = [];
    promises.push(telegram.informing.alertAdmin(message, env, level, logUrl));

    await Promise.allSettled(promises);
}

async function sendInfo(message, env, level = 'INFO', logUrl = '') {
    const promises = [];
    promises.push(telegram.informing.infoAdmin(message, env, level, logUrl));

    await Promise.allSettled(promises);
}

module.exports = {
    sendAlert,
    sendInfo
};
