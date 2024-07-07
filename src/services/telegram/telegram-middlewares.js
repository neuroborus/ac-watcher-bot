const telegram = require('../../configs/telegram.config');
const methods = require('./telegram.methods');

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
            await methods.deleteActionWithRetries(message);
        } catch (err) {
            console.error("processPin => " + err);
        }
    }
    return flag;
}

module.exports = {
    groupMiddleware
}
