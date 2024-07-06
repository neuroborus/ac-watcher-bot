const {writeFileSync} = require('node:fs');
const {maximizeDate, weekInMs} = require('../utils/time');
const {getGraphDataPath, pathToUrl} = require('../utils/filesystem');
const {TIME_EPSILON} = require('../configs/history.config');

function processData(sortedAscData) {
    const result = sortedAscData.reduce((acc, cur, i) => {
        acc.push({
            start: cur.createdAt,
            status: cur.isAvailable ? 'ON' : 'OFF',
        })

        if (i > 0) {
            if (sortedAscData[i - 1].createdAt.getDate() < cur.createdAt.getDate()) {
                acc[i - 1].end = maximizeDate(acc[i - 1].start);
            } else {
                acc[i - 1].end = cur.createdAt;
            }
        }
        return acc;
    }, []);
    result[result.length - 1].end = maximizeDate(result[result.length - 1].start);

    return result;
}

function writeGraphData(rawSortedData, type) {
    const processedData = processData(rawSortedData);
    const stringifiedData = JSON.stringify(processedData, null, '\t');
    const file = getGraphDataPath(type);

    writeFileSync(file, stringifiedData, 'utf8');

    return pathToUrl(file);
}

function checkForNextNearChanges(changeDate, isAvailable) {
    let data;
    try {
        data = require(getGraphDataPath('week'));
    } catch (err) {
        console.warn("can't open week data: " + err);
        return null;
    }
    const templateEl = data.find(el => {
        return (isAvailable ? 'ON' : 'OFF') === el.status &&
            new Date(el.start).getTime() - TIME_EPSILON < changeDate.getTime() - weekInMs &&
            new Date(el.end).getTime() + TIME_EPSILON > changeDate.getTime() - weekInMs;
    });
    if (!templateEl) return null;

    return new Date(templateEl.end);
}

module.exports = {
    writeGraphData,
    checkForNextNearChanges
}