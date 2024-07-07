const telegram = require('../../configs/telegram.config');
const {isEligibleChat} = require('../../utils/guard');

const approveEligibleChat = async (ctx, chat) => {
    if (!isEligibleChat(chat)) {
        const message = `Actions from not an eligible chat -> ${chat}`;
        console.warn(message);
        await ctx.reply(message);
        return false;
    }
    return true;
}
const approveAdminCommand = async (ctx, chat = 0) => {
    if (!chat) chat = ctx?.update?.message?.chat?.id;
    if (!(await approveEligibleChat(ctx, chat))) return false;
    if (ctx?.from?.id !== telegram.ADMIN) {
        await ctx.reply('You are not an admin!');
        return false;
    }
    return true;
}

module.exports = {
    approveEligibleChat,
    approveAdminCommand
}