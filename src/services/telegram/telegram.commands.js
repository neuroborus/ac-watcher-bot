const state = require('./telegram-state');
const guards = require('./telegram-guards');
const service = require('./telegram.service');
const methods = require('./telegram.methods');
const mongo = require('../mongo.service');
const filesystem = require('../../utils/filesystem');
const messages = require('../../utils/messages');
const telegram = require('../../configs/telegram.config');

const {checkForNextNearChanges} = require('../history/history-processor');
const {generateAndGetGraph} = require('../history/history.service');
const {MONGO_CONNECTED} = require('../../configs/mongo.config');
const {SAMPLE} = require('../../configs/history.config');


function initializeCommands(bot) {
    const me = (ctx) => ctx.reply(`PONG: user=${ctx?.from?.id} | chat=${ctx?.update?.message?.chat?.id}`);
    const sendLogFile = async (layer, ctx) => {
        const chat = ctx?.update?.message?.chat?.id;
        if (!(await guards.approveAdminCommand(ctx, chat))) return;
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
        if (!guards.approveEligibleChat(chat)) return;

        let previousStatus = state.getPreviousStatus() ?? (await mongo.getLastHistory()).isAvailable;
        if (state.getIsNotifying() || previousStatus === undefined) {
            ctx.reply('Try later...')
            return;
        }


        const msg = messages.formNotify(previousStatus, checkForNextNearChanges(new Date(), state.getPreviousStatus()));
        if (telegram.GROUPS.includes(chat)) {
            console.trace('Sending status to group ' + chat);
            await service.notifyGroup(msg, chat)
        } else {
            console.trace('Sending status to user ' + chat);
            await methods.sendMessage(msg, chat, {disable_notification: true});
        }
    };
    const graph = async (ctx, type) => {
        const chat = ctx?.update?.message?.chat?.id;
        if (!(await guards.approveAdminCommand(ctx, chat))) return;
        if (!MONGO_CONNECTED) {
            await ctx.reply('MongoDB is not connected!');
            return;
        }
        const file = await generateAndGetGraph(type, new Date());
        await methods.sendPhotoWithRetries(file, chat);
    }
    const graphWeek = (ctx) => graph(ctx, SAMPLE.WEEK);
    const graphMonth = (ctx) => graph(ctx, SAMPLE.MONTH);


    bot.start(me);
    bot.command('me', me);

    bot.command('trace', trace);
    bot.command('debug', debug);
    bot.command('info', info);
    bot.command('warn', warn);
    bot.command('error', error);
    bot.command('logs', logs);

    bot.command('status', status);
    bot.command('graph_week', graphWeek);
    bot.command('graph_month', graphMonth);
}

module.exports = {
    initializeCommands
}
