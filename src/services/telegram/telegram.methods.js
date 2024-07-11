const {bot} = require('./telegram-bot');
const fs = require('node:fs');
const time = require('../../utils/time');
const telegram = require('../../configs/telegram.config');
const notifications = require('../../configs/notifications.config');
const filesystem = require('../../utils/filesystem');
const informing = require('./telegram.informing');

async function sendMessage(msg, recipient, options = {}, attempt = 0) {
    let isSizeWell = true;
    let filepath = '';
    let document = '';
    let message;

    try {
        await time.sleep(telegram.REQUESTS_PAUSE_MS);
        await bot.telegram.sendChatAction(recipient, 'typing');
        await time.sleep(telegram.REQUESTS_PAUSE_MS);
        if (msg.length >= telegram.MAX_MSG_SIZE) {
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
        } catch (err) {
            // It is already message sending: bad practice to send the error to an admin
            console.error(
                `[${recipient}] [${attempt}/${telegram.RETRIES}] Sending message: ${err}`
            );
            if (attempt < telegram.RETRIES) {
                await time.sleep(telegram.RETRY_DELAY_MS);
                message = await sendMessage(msg, recipient, options, attempt + 1);
            }
        }

        if (filepath) {
            fs.unlinkSync(filepath);
        }
    } catch (err) {
        console.error(`[${recipient}] sendMessage -> ${err}`);
    }
    return message?.message_id;
}


async function deleteMessageWithRetries(msgId, chatId, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        try {
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.deleteMessage(chatId, msgId);
        } catch (err) {
            await informing.alertAdmin(
                `deleteMessageWithRetries [${msgId}][${attempt}/${telegram.RETRIES}] => ${err}`,
                'deleteMessageWithRetries',
                notifications.LEVEL.ERROR
            );
            await deleteMessageWithRetries(msgId, chatId, attempt + 1);
        }
    }
}

async function pinMessageWithRetries(msgId, chatId, options = {}, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        try {
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.pinChatMessage(chatId, msgId, options);
        } catch (err) {
            await informing.alertAdmin(
                `pinMessageWithRetries [${msgId}][${attempt}/${telegram.RETRIES}] => ${err}`,
                'pinMessageWithRetries',
                notifications.LEVEL.ERROR
            );
            await pinMessageWithRetries(msgId, chatId, options, attempt + 1);
        }
    }
}

async function sendFileWithRetries(filename, filepath, chatId, replyToMessageId = undefined, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        try {
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.sendChatAction(chatId, 'upload_document');
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            const document = {
                source: filepath,
                filename
            };
            await bot.telegram.sendDocument(chatId, document,{reply_to_message_id: replyToMessageId});
        } catch (err) {
            await informing.alertAdmin(
                `sendFileWithRetries [${filename}][${attempt}/${telegram.RETRIES}] => ${err}`,
                'sendFileWithRetries',
                notifications.LEVEL.ERROR
            );
            await sendFileWithRetries(filename, filepath, chatId, replyToMessageId, attempt + 1);
        }
    }
}

async function sendPhotoWithRetries(filepath, chatId, replyToMessageId = undefined, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        try {
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.sendChatAction(chatId, 'upload_photo');
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.sendPhoto(chatId, {source: filepath}, {reply_to_message_id: replyToMessageId});
        } catch (err) {
            await informing.alertAdmin(
                `[${chatId}] sendFileWithRetries [${filepath}][${attempt}/${telegram.RETRIES}] => ${err}`,
                'sendFileWithRetries',
                notifications.LEVEL.ERROR
            );
            await sendPhotoWithRetries(filepath, chatId, replyToMessageId, attempt + 1);
        }
    }
}

async function sendPhotosGroupWithRetries(photoPathsArray, chatId, replyToMessageId = undefined, attempt = 0) {
    if (attempt <= telegram.RETRIES) {
        const mediaGroup = photoPathsArray.map((photo) => {
            return {
                type: 'photo',
                media: {
                    source: photo
                }
            };
        });
        try {
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.sendChatAction(chatId, 'upload_photo');
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.sendMediaGroup(chatId, mediaGroup, {reply_to_message_id: replyToMessageId});
        } catch (err) {
            await informing.alertAdmin(
                `[${chatId}] sendPhotosGroupWithRetries [${mediaGroup.length}][${attempt}/${telegram.RETRIES}] => ${err}`,
                'sendPhotosGroupWithRetries',
                notifications.LEVEL.ERROR
            );
            await sendPhotosGroupWithRetries(photoPathsArray, chatId, replyToMessageId, attempt + 1);
        }
    }
}

async function deleteActionWithRetries(message, attempt = 0) {
    if (message?.message_id && attempt <= telegram.RETRIES) {
        try {
            await time.sleep(telegram.REQUESTS_PAUSE_MS);
            await bot.telegram.deleteMessage(message.chat.id, message.message_id);
        } catch (err) {
            await informing.alertAdmin(
                `[${message?.from?.id}] deleteActionWithRetries [${attempt}/${telegram.RETRIES}] => ${err}`,
                'deleteActionWithRetries',
                notifications.LEVEL.ERROR
            );
            await time.sleep(telegram.RETRY_DELAY_MS);
            await deleteActionWithRetries(message, attempt + 1);
        }
    }
}

module.exports = {
    sendMessage,
    deleteMessageWithRetries,
    pinMessageWithRetries,
    sendFileWithRetries,
    sendPhotoWithRetries,
    sendPhotosGroupWithRetries,
    deleteActionWithRetries
}
