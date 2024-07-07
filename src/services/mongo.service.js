const mongo = require('../mongo');
const {MONGO_CONNECTED} = require('../configs/mongo.config');


async function connectToMongo() {
    if (!MONGO_CONNECTED) return;
    await mongo.connectMongo();
}

async function createHistory(isAvailable) {
    if (!MONGO_CONNECTED) return;
    await mongo.History.create({isAvailable})
    console.trace(`Sent to DB -> ${isAvailable}`);
}

async function getLastHistory() {
    if (!MONGO_CONNECTED) return undefined;
    return await mongo.History.findOne().sort({createdAt: -1})
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

module.exports = {
    connectToMongo,
    createHistory,
    getLastHistory,
    findHistoriesAsc
}
