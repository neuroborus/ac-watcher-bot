

const telegram = require('./telegram.bot');

async function sendAlert (message, env, level = 'ALERT', logUrl = '') {
  const promises = [];
  promises.push(telegram.alertAdmin(message, env, level, logUrl));

  await Promise.allSettled(promises);
}

async function sendInfo (message, env, level = 'INFO', logUrl = '') {
  const promises = [];
  promises.push(telegram.infoAdmin(message, env, level, logUrl));

  await Promise.allSettled(promises);
}

module.exports = {
  sendAlert,
  sendInfo
};
