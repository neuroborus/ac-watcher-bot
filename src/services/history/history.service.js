const time = require('../../utils/time');
const mongo = require('../mongo.service');
const processor = require('./history-processor');
const plotter = require('./history-plotter');

const {SAMPLE} = require('../../configs/history.config');

async function generateAndGetGraph(type, nowDate) {
    let gte;
    const lte = nowDate.getTime();
    switch (type) {
        case SAMPLE.WEEK:
            gte = lte - time.WEEK_IN_MS;
            break;
        case SAMPLE.MONTH:
            const date = new Date(lte);
            const days = time.daysInMonth(date.getMonth(), date.getFullYear());
            gte = lte - time.daysInMs(days);
            break;
        default:
            return;
    }

    const rawSortedData = await mongo.findHistoriesAsc(gte, lte);

    const dataUrl = processor.writeHistoryData(rawSortedData, type);
    return await plotter.plot(dataUrl, type);
}

module.exports = {
    generateAndGetGraph,
}