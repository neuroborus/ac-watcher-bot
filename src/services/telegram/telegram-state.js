let isNotifying = false;
function setIsNotifying(isNotify) {
     isNotifying = isNotify;
}
function getIsNotifying() {
    return isNotifying;
}

const previousGroupsMessages = new Map(); // groupId - messageId
function setGroupMessage(groupId, messageId) {
    previousGroupsMessages.set(groupId, messageId);
}
function getGroupMessage(groupId) {
    return previousGroupsMessages.get(groupId);
}

let previousStatus;
function setPreviousStatus(prevStatus) {
    previousStatus = prevStatus;
}
function getPreviousStatus() {
    return  previousStatus;
}

module.exports = {
    setIsNotifying,
    getIsNotifying,
    setGroupMessage,
    getGroupMessage,
    setPreviousStatus,
    getPreviousStatus
}