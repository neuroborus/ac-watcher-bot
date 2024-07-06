const {isObservedLevel} = require('./levels');
const {TIMEZONE} = require('../configs/history.config');

function formHtmlTagsMessage(where, what, level, logUrl = '') {
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

function formNotify(isOn, nextNearChange = null) {
    let notify;
    if (isOn) {
        notify = '🟢 <b>CONNECTION IS #ESTABLISHED</b>';
    } else {
        notify = '🔴 <b>CONNECTION IS #LOST</b>';
    }

    if (nextNearChange) {
        notify +=
            `\n⏳ <i>The next #${isOn ? 'lost' : 'reinstatement'} is expected at approximately:` +
            `\n<u>${nextNearChange.toLocaleString('en-GB', {timeZone: TIMEZONE})}</u>` +
            `\t(${TIMEZONE})</i>`;
    }
    return notify;
}

module.exports = {
    formHtmlTagsMessage,
    addEmojiPrefix,
    formNotify
};
