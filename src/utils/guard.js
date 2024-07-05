const {ADMIN, USERS, GROUPS} = require("../configs/telegram.config");

function isEligibleChat(chatId) {
    const chats = [ADMIN, ...USERS, ...GROUPS];
    return chats.includes(chatId);
}

module.exports = {
    isEligibleChat,
}