const { NOTIFY_ABOUT_LEVEL } = require('../constants/notifications.constants');

function isObservedLevel(level) {
  return NOTIFY_ABOUT_LEVEL.some(l => l.toLowerCase() === level.toLowerCase());
}

module.exports = {
  isObservedLevel
}
