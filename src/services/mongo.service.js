const mongo = require('../mongo');
const {MONGO_CONNECTED, MONGO_SESSIONS} = require('../configs/mongo.config');


async function connectToMongo() {
    if (!MONGO_CONNECTED) return;
    await mongo.connectMongo();
}

function getSessions() {
    if (!MONGO_CONNECTED || !MONGO_SESSIONS) return undefined;
    return mongo.sessions;
}

// History

async function createHistory(isAvailable) {
    if (!MONGO_CONNECTED) return;
    await mongo.History.create({isAvailable})
    console.trace(`Sent to DB -> ${isAvailable}`);
}

async function getLastHistory() {
    if (!MONGO_CONNECTED) return undefined;
    return await mongo.History.findOne().sort({createdAt: -1})
}

async function getNextHistory(prevDate) {
    if (!MONGO_CONNECTED) return undefined;
    return await mongo.History.findOne(
        {
            createdAt: {
                "$gte": prevDate
            }
        }
    ).sort({createdAt: 1});
}

    async function findHistoriesAsc(gte, lte) {
        if (!MONGO_CONNECTED) return [];
        return await mongo.History.find(
            {
                createdAt: {
                    "$gte": gte,
                    "$lte": lte
                }
            }
        ).sort({createdAt: 1});
    }

// GroupMessage

    async function setGroupMessage(groupId, messageId) {
        if (!MONGO_CONNECTED) return undefined;
        return await mongo.GroupMessage.findOneAndUpdate(
            {groupId},
            {messageId},
            {
                new: true, // Always returning updated work experiences.
                upsert: true, // By setting this true, it will create if it doesn't exist
                projection: {_id: 0, __v: 0}, // without return _id and __v
            });
    }

    async function getGroupMessage(groupId) {
        if (!MONGO_CONNECTED) return undefined;
        const obj = await mongo.GroupMessage.findOne({groupId});
        return obj?.messageId;
    }

    module.exports = {
        connectToMongo,
        getSessions,
        createHistory,
        getLastHistory,
        getNextHistory,
        findHistoriesAsc,
        setGroupMessage,
        getGroupMessage
    }
