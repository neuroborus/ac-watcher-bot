const state = require('./telegram-state');
const guards = require('./telegram-guards');
const service = require('./telegram.service');
const methods = require('./telegram.methods');
const mongo = require('../mongo.service');
const filesystem = require('../../utils/filesystem');
const messages = require('../../utils/messages');
const telegram = require('../../configs/telegram.config');
const history = require('../history');

const {MONGO_CONNECTED} = require('../../configs/mongo.config');
const {SAMPLE} = require('../../configs/history.config');
const {PREDICTION} = require('../../configs/watcher.config');

const me = (ctx) => ctx.reply(`PONG: user=${ctx?.from?.id} | chat=${ctx?.update?.message?.chat?.id}`);
const sendLogFile = async (layer, ctx) => {
    const chat = ctx?.update?.message?.chat?.id;
    if (!(await guards.approveAdminCommand(ctx, chat))) return;
    layer = layer.toLowerCase();
    const document = {
        source: filesystem.getLogsPath(layer),
        filename: layer + '.log',
    }
    await methods.sendFileWithRetries(document.filename, document.source, chat, ctx?.update?.message?.message_id)
};
const trace = async (ctx) => await sendLogFile('trace', ctx);
const debug = async (ctx) => await sendLogFile('debug', ctx);
const info = async (ctx) => await sendLogFile('info', ctx);
const warn = async (ctx) => await sendLogFile('warn', ctx);
const error = async (ctx) => await sendLogFile('error', ctx);
const logs = async (ctx) => await sendLogFile('logs', ctx);

const status = async (ctx) => {
    const chat = ctx?.update?.message?.chat?.id;
    if (!(await guards.approveEligibleChat(ctx, chat))) return;
    console.trace(`[${chat}] Initiated sending status by user -> ${ctx?.from?.id}`);

    let previousStatus = state.getPreviousStatus() ?? (await mongo.getLastHistory())?.isAvailable;
    if (state.getIsNotifying() || previousStatus === undefined) {
        ctx.reply('Try later...')
        return;
    }

    const change = PREDICTION ?
        await history.checkForNextChange(new Date(), previousStatus, 0) :
        undefined;
    const msg = messages.formNotify(previousStatus, change);
    if (telegram.GROUPS.includes(chat)) {
        console.trace(`[${chat}] Sending status to group by user -> ${ctx?.from?.id}`);
        await service.notifyGroup(msg, chat)
    } else {
        console.trace(`[${chat}] Sending status to user -> ${ctx?.from?.id}`);
        await methods.sendMessage(msg, chat, {disable_notification: true});
    }
};
const graphTyped = async (ctx, type) => {
    const chat = ctx?.update?.message?.chat?.id;
    if (!(await guards.approveEligibleChat(ctx, chat))) return;
    console.trace(`[${chat}] Initiated sending ${type.toUpperCase()} graph to user -> ${ctx?.from?.id}`);
    if (!MONGO_CONNECTED) {
        const msg = 'DB is not connected!';
        console.trace(msg);
        await ctx.reply(msg);
        return;
    }
    const file = await history.createGraph(type, new Date());
    console.trace(`[${chat}] Sending ${type.toUpperCase()} graph to user -> ${ctx?.from?.id}`);
    await methods.sendPhotoWithRetries(file, chat);
}
const graphWeek = (ctx) => graphTyped(ctx, SAMPLE.WEEK);
const graphMonth = (ctx) => graphTyped(ctx, SAMPLE.MONTH);


const graph = async (ctx) => {
    const chat = ctx?.update?.message?.chat?.id;
    if (!(await guards.approveEligibleChat(ctx, chat))) return;
    console.trace(`[${chat}] Initiated sending graphs to user -> ${ctx?.from?.id}`);
    if (!MONGO_CONNECTED) {
        const msg = 'DB is not connected!';
        console.trace(msg);
        await ctx.reply(msg);
        return;
    }
    const nowDate = new Date();
    // !: Heavy operations -> one-by-one
    const weekFile = await history.createGraph(SAMPLE.WEEK, nowDate);
    const monthFile = await history.createGraph(SAMPLE.MONTH, nowDate);
    const files = [weekFile, monthFile];
    console.trace(`[${chat}] Sending graphs to user -> ${ctx?.from?.id}`);
    await methods.sendPhotosGroupWithRetries(files, chat)
}

function initializeCommands(bot) {
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
    bot.command('graphs', graph);
}

module.exports = {
    initializeCommands
}
