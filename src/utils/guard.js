const {ADMIN, USERS, GROUPS} = require("../constants/telegram.constants");

function isEligibleChat(chatId) {
    const chats = [ADMIN, ...USERS, ...GROUPS];
    return chats.includes(chatId);
}

module.exports = {
    isEligibleChat,
}