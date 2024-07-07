const {Telegraf} = require('telegraf');
const {TELEGRAM_BOT_TOKEN} = process.env;

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

module.exports = {
    bot,
};
