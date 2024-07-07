const telegram = require('../../configs/telegram.config');
const {isEligibleChat} = require('../../utils/guard');

const approveEligibleChat = (chat) => {
    if (!isEligibleChat(chat)) {
        console.warn('Actions from not an eligible chat -> ' + chat);
        return false;
    }
    return true;
}
const approveAdminCommand = async (ctx, chat = 0) => {
    if (!chat) chat = ctx?.update?.message?.chat?.id;
    if (!approveEligibleChat(chat)) return false;
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