const {bot} = require('./telegram-bot');
const telegram = require('../../configs/telegram.config');
const messages = require('../../utils/messages');
const filesystem = require('../../utils/filesystem');
const state = require('./telegram-state');
const methods = require('./telegram.methods');
const mongo = require('../mongo.service');

const {checkForNextNearChanges} = require('../history/history-processor');




async function logsToAdmin(layer) {
    layer = layer.toLowerCase();
    const document = {
        source: filesystem.getLogsPath(layer),
        filename: layer + '.log',
    }
    await bot.telegram.sendDocument(telegram.ADMIN, document);
}

async function fileToChannel(filename, filepath) {
    await methods.sendFileWithRetries(filename, filepath, telegram.CHANNEL);
}

async function photoToChannel(filepath) {
    await methods.sendPhotoWithRetries(filepath, telegram.CHANNEL);
}

async function notifyAboutStatus(status) {
    state.setIsNotifying(true); // It is not a singleton!

    state.setPreviousStatus(status);
    const msg = messages.formNotify(status, checkForNextNearChanges(new Date(), status));
    if (telegram.NOTIFY_ADMIN) {
        await methods.sendMessage(msg, telegram.ADMIN, {disable_notification: telegram.ADMIN_NOTIFY_WITH_SOUND});
    }
    await methods.sendMessage(msg, telegram.CHANNEL, {disable_notification: telegram.CHANNEL_NOTIFY_WITH_SOUND});
    for (const user of telegram.USERS) {
        await methods.sendMessage(msg, user, {disable_notification: telegram.USERS_NOTIFY_WITH_SOUND});
    }
    for (const group of telegram.GROUPS) {
        await notifyGroup(msg, group);
    }
    state.setIsNotifying(false);
}

async function notifyGroup(msg, groupId) {
    const prevMsgId = state.getGroupMessage(groupId) || await mongo.getGroupMessage(groupId);
    const newMsgId = await methods.sendMessage(msg, groupId, {disable_notification: true});
    if (prevMsgId) await methods.deleteMessageWithRetries(prevMsgId, groupId);
    state.setGroupMessage(groupId, newMsgId);
    await mongo.setGroupMessage(groupId, newMsgId);
    if (telegram.PIN_STATUS_IN_GROUPS) {
        await methods.pinMessageWithRetries(newMsgId, groupId, {disable_notification: true});
    }
}

module.exports = {
    logsToAdmin,
    fileToChannel,
    photoToChannel,
    notifyAboutStatus,
    notifyGroup
}