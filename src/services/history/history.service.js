const fs = require('node:fs/promises');
const time = require('../../utils/time');
const mongo = require('../mongo.service');
const processor = require('./history-processor');
const plotter = require('./history-plotter');
const history = require('../../configs/history.config');

// Returns graph image path
async function createGraph(type, nowDate) {
    let gte;
    const lte = nowDate.getTime();
    switch (type) {
        case history.SAMPLE.WEEK:
            gte = lte - time.WEEK_IN_MS;
            break;
        case history.SAMPLE.MONTH:
            const date = new Date(lte);
            const days = time.daysInMonth(date.getMonth(), date.getFullYear());
            gte = lte - time.daysInMs(days);
            break;
        default:
            return;
    }

    const rawSortedData = await mongo.findHistoriesAsc(gte, lte);

    const dataPath = await processor.createGraphData(rawSortedData, type);
    const graph = await plotter.plot(dataPath, type)
    await fs.rm(dataPath);
    return graph;
}

async function checkForNextChange(changeDate, isAvailable, epsilon = history.TIME_EPSILON) {
    const nearestDate = new Date(changeDate.getTime() - time.SCHEDULE_CYCLE_MS + epsilon);
    const templateEl = await mongo.getNextHistory(nearestDate);
    if (!templateEl || templateEl.isAvailable === isAvailable) return undefined;

    return new Date(new Date(templateEl.createdAt).getTime() + time.SCHEDULE_CYCLE_MS);
}

module.exports = {
    createGraph,
    checkForNextChange
}