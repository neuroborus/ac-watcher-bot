const {bot} = require('./telegram-bot');
const messages = require('../../utils/messages');
const telegram = require('../../configs/telegram.config');
const state = require('./telegram-state');
const middlewares = require('./telegram-middlewares');
const commands = require('./telegram.commands');
const methods = require('./telegram.methods');

const {checkForNextNearChanges} = require('../history-processor');
const filesystem = require("../../utils/filesystem");


function startBot() {
    bot.use(middlewares.groupMiddleware);
    bot.catch(async (err, ctx) => {
        console.error('Telegram bot caught error -> ' + err);
    });
    commands.initializeCommands();
    bot.telegram.setMyCommands(telegram.COMMANDS)
        .catch(e => console.error(e));
    bot.launch()
        .then(r => console.log('Bot started!'))
        .catch(e => console.error(e));
}

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
    const prevMsgId = state.getGroupMessage(groupId);
    const newMsgId = await methods.sendMessage(msg, groupId, {disable_notification: true});
    if (prevMsgId) await methods.deleteMessageWithRetries(prevMsgId, groupId);
    state.setGroupMessage(groupId, newMsgId);
    if (telegram.PIN_STATUS_IN_GROUPS) {
        await methods.pinMessageWithRetries(newMsgId, groupId, {disable_notification: true});
    }
}

module.exports = {
    startBot,
    logsToAdmin,
    fileToChannel,
    photoToChannel,
    notifyAboutStatus,
    notifyGroup
}