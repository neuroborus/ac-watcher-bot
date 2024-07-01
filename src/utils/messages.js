const { isObservedLevel } = require('./levels');

function formHtmlTagsMessage (where, what, level, logUrl = '') {
  return `<b>#${level}-#${where}:</b> ${what}`
  + (logUrl ? `\n<a href="${logUrl}">Full log</a>` : '');
}

function addEmojiPrefix(text, level, isAlert = false) {
  if (isObservedLevel(level)) {
    ///
    if (isAlert) {
      return '❗️ ❗️ ❗️  ' + text;
    } else {
      return '❗️ ' + text;
    }
    ///
  } else {
    ///
    if (isAlert) {
      return '⚠️ ' + text;
    } else {
      return 'ℹ️ ' + text;
    }
    ///
  }
}

function formNotify(isOn) {
  if (isOn) {
    return '🟢 CONNECTION #ESTABLISHED';
  }
  return '🔴 CONNECTION #LOST';
}

module.exports = {
  formHtmlTagsMessage,
  addEmojiPrefix,
  formNotify
};
