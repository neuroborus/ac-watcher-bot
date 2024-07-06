const {weekInMs, daysInMonth, daysInMs} = require('../utils/time');
const {History} = require('../mongo');
const {writeGraphData} = require('./history-processor');
const {plot} = require('./graph-plotter');

async function generateAndGetGraph(type, nowDate) {
    let gte;
    const lte = nowDate.getTime();
    switch (type) {
        case 'week':
            gte = lte - weekInMs;
            break;
        case 'month':
            const date = new Date(lte);
            const days = daysInMonth(date.getMonth(), date.getFullYear());
            gte = lte - daysInMs(days);
            break;
        default:
            return;
    }

    const rawSortedData = await History.find(
        {
            createdAt: {
                "$gte": gte,
                "$lte": lte
            }
        }
    ).sort({createdAt: 1});

    const dataUrl = writeGraphData(rawSortedData, type);
    return await plot(dataUrl, type);
}

module.exports = {
    generateAndGetGraph,
}