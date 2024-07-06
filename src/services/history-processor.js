const {writeFileSync} = require('node:fs');
const {maximizeDate, weekInMs, minimizeDate, plusMinute} = require('../utils/time');
const {getGraphDataPath, pathToUrl, getTimezonedGraphDataPath} = require('../utils/filesystem');
const {TIME_EPSILON, LOCALE, TIMEZONE} = require('../configs/history.config');

function processData(sortedAscData) {
    const result = sortedAscData.reduce((acc, cur, i) => {
        acc.push({
            start: cur.createdAt,
            status: cur.isAvailable ? 'ON' : 'OFF',
        });

        if (i > 0) {
            if (sortedAscData[i - 1].createdAt.getDate() < cur.createdAt.getDate()) {
                // if new day
                acc[i - 1].end = maximizeDate(acc[i - 1].start);
                acc[i].start = minimizeDate(cur.createdAt)
            } else {
                acc[i - 1].end = cur.createdAt;
            }
        }
        return acc;
    }, []);

    result[0].start = minimizeDate(result[0].start);
    result[result.length-1].end = new Date();

    return result;
}

function writeHistoryData(rawSortedData, type) {
    const processedData = processData(rawSortedData);
    const timezonedData = processedData.map(el => {
        if (el.start) el.start = el.start.toLocaleString(LOCALE, {timeZone: TIMEZONE});
        if (el.end) el.end = el.end.toLocaleString(LOCALE, {timeZone: TIMEZONE});
        return el;
    })
    const stringifiedData = JSON.stringify(processedData, null, '\t');
    const stringifiedTimezonedData = JSON.stringify(timezonedData, null, '\t');

    const timezonedFile = getTimezonedGraphDataPath(type)
    writeFileSync(getGraphDataPath(type), stringifiedData, 'utf8');
    writeFileSync(timezonedFile, stringifiedTimezonedData, 'utf8');

    return pathToUrl(timezonedFile);
}

function checkForNextNearChanges(changeDate, isAvailable) {
    let data;
    try {
        data = require(getGraphDataPath('week'));
    } catch (err) {
        console.warn("can't open week data: " + err);
        return null;
    }

    let templateEl;
    for(let i = 0; i < data.length; i++) {
        const el = data[i];
        if ((isAvailable ? 'ON' : 'OFF') === el.status &&
            new Date(el.start).getTime() - TIME_EPSILON < changeDate.getTime() - weekInMs &&
            new Date(el.end).getTime() + TIME_EPSILON > changeDate.getTime() - weekInMs) {
            if (data.length > i && data[i+1].status === el.status) {
                templateEl = data[i+1];
            }
            templateEl = el;
        }
    }

    if (!templateEl) return null;

    return new Date(templateEl.end);
}

module.exports = {
    writeGraphData: writeHistoryData,
    checkForNextNearChanges
}