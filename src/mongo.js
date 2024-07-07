const {mongoose} = require('mongoose');
const {MONGO_URL, HISTORY_TTL} = require("./configs/mongo.config");

const history = new mongoose.Schema({
    createdAt: {type: Date, expires: HISTORY_TTL, default: Date.now, index: true},
    isAvailable: {type: Boolean},
});
const groupMessage = new mongoose.Schema({
    createdAt: {type: Date, default: Date.now, index: true},
    groupId: {type: Number, index: true, required: true, unique: true},
    messageId: {type: Number, required: true},
});

const History = mongoose.model('History', history);
const GroupMessage = mongoose.model('GroupMessage', groupMessage);

async function connectMongo() {
    await mongoose.connect(MONGO_URL);
    await History.createIndexes();
    await GroupMessage.createIndexes();
    console.info("Mongo connected!")
}

module.exports = {
    connectMongo,
    History,
    GroupMessage
}