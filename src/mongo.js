const {mongoose} = require('mongoose');
const {MONGO_URL, HISTORY_TTL} = require("./configs/mongo.config");

const history = new mongoose.Schema({
    createdAt: { type: Date, expires: HISTORY_TTL, default: new Date() , index: true },
    isAvailable: { type: Boolean },
});

const History = mongoose.model('History', history);

async function connectMongo() {
    await mongoose.connect(MONGO_URL);
    await History.createIndexes();
    console.info("Mongo connected!")
}

module.exports = {
    connectMongo,
    History
}