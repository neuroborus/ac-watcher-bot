const {bot} = require('./telegram-bot');
const messages = require('../../utils/messages');
const time = require('../../utils/time');
const telegram = require('../../configs/telegram.config');

async function infoAdmin(what, where, level, logUrl = '', attempt = 0) {
    console.trace(`informing (${where}) =-> ${what}`);
    const msg = messages.formHtmlTagsMessage(where, what, level, logUrl);
    try {
        await bot.telegram.sendMessage(
                telegram.ADMIN,
                messages.addEmojiPrefix(msg, level, false),
                {parse_mode: 'HTML', disable_notification: true}
            );
    } catch (err) {
        console.error(`[${attempt}/${telegram.RETRIES}] infoAdmin() -> ${err}`);
        if (attempt < telegram.RETRIES) {
            await time.sleep(telegram.RETRY_DELAY_MS);
            await infoAdmin(what, where, level, logUrl, attempt + 1);
        }
    }

}

async function alertAdmin(what, where, level, logUrl = '', attempt = 0) {
    console.trace(`alerting (${where}) =-> ${what}`);
    const msg = messages.formHtmlTagsMessage(where, what, level, logUrl);
    try {
        await bot.telegram.sendMessage(
            telegram.ADMIN,
            messages.addEmojiPrefix(msg, level, true),
            {parse_mode: 'HTML', disable_notification: false}
        );
    } catch (err) {
        console.error(`[${attempt}/${telegram.RETRIES}] alertAdmin() -> ${err}`);
        if (attempt < telegram.RETRIES) {
            await time.sleep(telegram.RETRY_DELAY_MS);
            await alertAdmin(what, where, level, logUrl, attempt + 1);
        }
    }
}

module.exports = {
    infoAdmin,
    alertAdmin
}
