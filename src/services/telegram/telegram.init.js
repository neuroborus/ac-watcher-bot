const {bot} = require('./telegram-bot');
const mongo = require('../mongo.service');
const middlewares = require('./telegram-middlewares');
const commands = require('./telegram.commands');
const telegram = require('../../configs/telegram.config');

function startBot() {
    const sessions = mongo.getSessions();
    if (sessions) bot.use(sessions);
    bot.use(middlewares.groupMiddleware);
    bot.catch(async (err, ctx) => {
        console.error('Telegram bot caught error -> ' + err);
    });
    commands.initializeCommands(bot);
    bot.telegram.setMyCommands(telegram.COMMANDS)
        .catch(e => console.error(e));
    bot.launch()
        .then(r => console.log('Bot started!'))
        .catch(e => console.error(e));
}

module.exports = {
    startBot,
}
