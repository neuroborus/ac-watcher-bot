const {Telegraf} = require('telegraf');
const fs = require('fs');
const telegram = require('../configs/telegram.config');
const {formHtmlTagsMessage, addEmojiPrefix, formNotify} = require('../utils/messages');
const {sleep} = require('../utils/time');
const filesystem = require('../utils/filesystem');
const {isEligibleChat} = require('../utils/guard');
const {checkForNextNearChanges} = require('./history-processor');
const {TELEGRAM_BOT_TOKEN} = process.env;


const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const me = (ctx) => ctx.reply(`PONG: user=${ctx?.from?.id} | chat=${ctx?.update?.message?.chat?.id}`);

const sendLogFile = async (layer, ctx) => {
    const chat = ctx?.update?.message?.chat?.id;
    if (!isEligibleChat(chat)) {
        console.warn('Actions from not an eligible chat -> ' + chat);
        return;
    }
    if (ctx?.from?.id !== telegram.ADMIN) {
        await ctx.reply('You are not an admin!');
        return;
    }
    layer = layer.toLowerCase();
    const document = {
        source: filesystem.getLogsPath(layer),
        filename: layer + '.log',
    }
    await bot.telegram.sendDocument(chat, document);
};
const trace = async (ctx) => await sendLogFile('trace', ctx);
const debug = async (ctx) => await sendLogFile('debug', ctx);
const info = async (ctx) => await sendLogFile('info', ctx);
const warn = async (ctx) => await sendLogFile('warn', ctx);
const error = async (ctx) => await sendLogFile('error', ctx);
const logs = async (ctx) => await sendLogFile('logs', ctx);

const status = async (ctx) => {
    const chat = ctx?.update?.message?.chat?.id;
    if (!isEligibleChat(chat)) {
        console.warn('Actions from not an eligible chat -> ' + chat);
        return;
    }

    if (isNotifying || previousStatus === 'undefined') ctx.reply('Try later...')
    const msg = formNotify(previousStatus, checkForNextNearChanges(new Date(), previousStatus));
    if (telegram.GROUPS.includes(chat)) {
        console.trace('Sending status to group ' + chat);
        await notifyGroup(msg, chat)
    }
    if (telegram.ADMIN === chat || telegram.USERS.includes(chat)) {
        console.trace('Sending status to user ' + chat);
        await sendMessage(msg, chat, {disable_notification: true});
    }
};

bot.start(me);
bot.command('me', me);

bot.command('trace', trace);
bot.command('debug', debug);
bot.command('info', info);
bot.command('warn', warn);
bot.command('error', error);
bot.command('logs', logs);

bot.command('status', status);


function startBot() {
    bot.use(groupMiddleware);
    bot.catch(async (err, ctx) => {
        console.error('Telegram bot caught error -> ' + err);
    });
    bot.telegram.setMyCommands(telegram.COMMANDS)
        .catch(e => console.error(e));
    bot.launch()
        .then(r => console.log('Bot started!'))
        .catch(e => console.error(e));
}

/////////////////////////// MESSAGING

async function sendMessage(msg, recipient, options = {}, attempt = 0) {
    let isSizeWell = true;
    let filepath = '';
    let document = '';
    let message;

    try {
        await sleep(telegram.REQUESTS_PAUSE_MS);
        if (telegram.MAX_MSG_SIZE <= msg.length) {
            isSizeWell = false;
            const prefix = options?.disable_notification ? 'ERROR__' : 'FATAL__';
            const filename = prefix + new Date().toISOString() + '.html';
            filepath = filesystem.createFilePath(filename);
            fs.writeFileSync(filepath, msg);
            document = {
                source: filepath,
                filename
            };
            console.debug(filename + ' ' + filepath);
        }

        try {
            if (isSizeWell) {
                message = await bot.telegram.sendMessage(
                    recipient,
                    msg,
                    {parse_mode: 'HTML', ...options}
                );
            } else {
                message = await bot.telegram.sendDocument(recipient, document);
            }
        } catch (e) {
            console.error(
                `[${recipient}] ` +
                `[${attempt}/${telegram.RETRIES}] Sending message: ${e}`
            );
            if (attempt < telegram.RETRIES) {
                setTimeout(async () => {
                    await sendMessage(msg, recipient, options, attempt + 1);
                }, telegram.RETRY_DELAY_MS);
            }
        }

        if (filepath) {
            fs.unlinkSync(filepath);
        }
    } catch (e) {
        console.error(
            `[${recipient}] ` +
            'sendMessage -> ' +
            e
        );
    }
    return message?.message_id;
}


async function deleteMessageWithRetries(msgId, chatId, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        try {
            await sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.deleteMessage(chatId, msgId);
        } catch (e) {
            await alertAdmin(
                `deleteMessageWithRetries [${msgId}][${attempt}/${
                    telegram.RETRIES
                }] => ` + e,
                'deleteMessageWithRetries',
            );
            await deleteMessageWithRetries(msgId, chatId, attempt + 1);
        }
    }
}

async function pinMessageWithRetries(msgId, chatId, options = {}, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        try {
            await sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.pinChatMessage(chatId, msgId, options);
        } catch (e) {
            await alertAdmin(
                `pinMessageWithRetries [${msgId}][${attempt}/${
                    telegram.RETRIES
                }] => ` + e,
                'pinMessageWithRetries',
            );
            await pinMessageWithRetries(msgId, chatId, options, attempt + 1);
        }
    }
}

async function sendFileWithRetries(filename, filepath, chatId, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        try {
            await sleep(telegram.REQUESTS_PAUSE_MS);
            const document = {
                source: filepath,
                filename
            };
            await bot.telegram.sendDocument(chatId, document);
        } catch (e) {
            await alertAdmin(
                `sendFileWithRetries [${filename}][${attempt}/${
                    telegram.RETRIES
                }] => ` + e,
                'sendFileWithRetries',
            );
            await sendFileWithRetries(filename, filepath, chatId, attempt + 1);
        }
    }
}

async function sendPhotoWithRetries(filepath, chatId, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        try {
            await sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.sendPhoto(chatId, {source: filepath});
        } catch (e) {
            await alertAdmin(
                `sendFileWithRetries [${filepath}][${attempt}/${
                    telegram.RETRIES
                }] => ` + e,
                'sendFileWithRetries',
            );
            await sendPhotoWithRetries(filepath, chatId, attempt + 1);
        }
    }
}


/////////////////////////////// WRAPPERS

async function infoAdmin(what, where, level, logUrl) {
    const msg = formHtmlTagsMessage(where, what, level, logUrl);
    await sendMessage(
        addEmojiPrefix(msg, level, false),
        telegram.ADMIN,
        {disable_notification: true}
    );
}

async function alertAdmin(what, where, level, logUrl) {
    const msg = formHtmlTagsMessage(where, what, level, logUrl);
    await sendMessage(
        addEmojiPrefix(msg, level, true),
        telegram.ADMIN,
        {disable_notification: false}
    );
}

async function fileToChannel(filename, filepath) {
    await sendFileWithRetries(filename, filepath, telegram.CHANNEL);
}

async function photoToChannel(filepath) {
    await sendPhotoWithRetries(filepath, telegram.CHANNEL);
}

////////////////////////////// Notifications
let isNotifying = false; // It is not a singleton!
let previousGroupsMessages = new Map(); // groupId - messageID
let previousStatus;

async function notifyAboutStatus(status) {
    isNotifying = true;

    previousStatus = status;
    const msg = formNotify(status, checkForNextNearChanges(new Date(), status));
    if (telegram.NOTIFY_ADMIN) {
        await sendMessage(msg, telegram.ADMIN, {disable_notification: telegram.ADMIN_NOTIFY_WITH_SOUND});
    }
    await sendMessage(msg, telegram.CHANNEL, {disable_notification: telegram.CHANNEL_NOTIFY_WITH_SOUND});
    for (const user of telegram.USERS) {
        await sendMessage(msg, user, {disable_notification: telegram.USERS_NOTIFY_WITH_SOUND});
    }
    for (const group of telegram.GROUPS) {
        await notifyGroup(msg, group);
    }
    isNotifying = false;
}

async function notifyGroup(msg, groupId) {
    const prevMsgId = previousGroupsMessages.get(groupId);
    const newMsgId = await sendMessage(msg, groupId, {disable_notification: true});
    if (prevMsgId) await deleteMessageWithRetries(prevMsgId, groupId);
    previousGroupsMessages.set(groupId, newMsgId);
    if (telegram.PIN_STATUS_IN_GROUPS) {
        await pinMessageWithRetries(newMsgId, groupId, {disable_notification: true});
    }
}


///////////////////////////////////////////// MIDDLEWARES

async function groupMiddleware(ctx, next) {
    try {
        const currentChatId = ctx?.update?.message?.chat?.id;
        if (currentChatId && currentChatId < 0) {
            // If chat is group
            if (telegram.CHANNEL !== currentChatId && !telegram.GROUPS.includes(currentChatId)) {
                // if is not our group
                await ctx.leaveChat();
            } else {
                if (!(await processPin(ctx))) {
                    // place for other middlewares
                }
                return;
            }
        }
    } catch (err) {
        console.error("groupMiddleware => " + err);
    }
    await next();
}

const processPin = async (ctx) => {
    let flag = false;
    const message = ctx?.update?.message;
    if (message?.pinned_message) {
        flag = true;
        try {
            // await ctx.telegram.deleteMessage(message.chat.id, message.message_id);
            await deleteActionWithRetries(message);
        } catch (err) {
            console.error("processPin => " + err);
        }
    }
    return flag;
}

const deleteActionWithRetries = async (message, attempt = 0) => {
    if (message?.message_id && attempt < 2) {
        try {
            await bot.telegram.deleteMessage(message.chat.id, message.message_id);
        } catch (e) {
            console.error(
                message?.from?.id + ' ' +
                `deleteActionWithRetries [${attempt}/${
                    telegram.RETRIES
                }] => ` + e
            );
            await sleep(telegram.RETRY_DELAY_MS);
            await deleteActionWithRetries(message, attempt + 1);
        }
    } else {
        throw new Error(
            `All retries to delete action message failed after ${
                attempt - 1
            } attempts`,
        );
    }
};


module.exports = {
    bot,
    startBot,
    infoAdmin,
    alertAdmin,
    sendLogFile,
    notifyAboutStatus,
    photoToChannel,
};
