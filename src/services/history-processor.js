const {writeFileSync} = require('node:fs');
const {maximizeDate, weekInMs, minimizeDate} = require('../utils/time');
const {getGraphDataPath, pathToUrl, getTimezonedGraphDataPath} = require('../utils/filesystem');
const {TIME_EPSILON, LOCALE, TIMEZONE} = require('../configs/history.config');

function processData(sortedAscData) {
    const result = sortedAscData.reduce((acc, cur, i) => {
        const size = acc.length;
        const lastInd = size - 1;
        if (size > 0) {
            if (acc[lastInd].start.getDate() < cur.createdAt.getDate()) {
                acc[lastInd].end = maximizeDate(acc[lastInd].start);
                acc.push({
                    start: minimizeDate(cur.createdAt),
                    end: cur.createdAt,
                    status: acc[lastInd].status,
                });
            } else {
                acc[lastInd].end = cur.createdAt;
            }
        }
        acc.push({
            start: cur.createdAt,
            status: cur.isAvailable ? 'ON' : 'OFF',
        });
        return acc;
    }, []);

    // result[0].start = minimizeDate(result[0].start);
    const nowDate = new Date();
    let endBorder = maximizeDate(result[result.length-1].start);
    endBorder = endBorder > nowDate ? nowDate : endBorder;
    result[result.length-1].end = endBorder;

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