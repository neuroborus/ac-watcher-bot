const fs = require('node:fs/promises');
const history = require('../../configs/history.config');
const time = require('../../tools/time');
const filesystem = require('../../tools/filesystem');

const { availabilityToStatus, changeStatus } = require('./history-status');

const fill = (start, end, status) => {
    const result = [];
    let currentStart = start;
    while (time.maximizeDate(currentStart) < time.maximizeDate(end)) {
        result.push({
            start: currentStart,
            end: time.maximizeDate(currentStart),
            status,
        });
        currentStart = time.plusDay(time.minimizeDate(currentStart));
    }
    if (currentStart < end) {
        result.push({
            start: currentStart,
            end,
            status
        });
    }
    return result;
}

function processGraphData(sortedAscData, startDate, endDate) {
    let result = sortedAscData.reduce((acc, cur) => {
        if (acc.length > 0) {
            if (time.maximizeDate(acc[acc.length-1].start) < time.maximizeDate(cur.createdAt)) {
                const prev = acc.pop();
                const subArr = fill(prev.start, cur.createdAt, prev.status);
                acc = acc.concat(subArr);
            } else {
                acc[acc.length-1].end = cur.createdAt;
            }
        }
        acc.push({
            start: cur.createdAt,
            status: availabilityToStatus(cur.isAvailable),
        });
        return acc;
    }, []);

    const startArr = fill(startDate, result[0].start, changeStatus(result[0].status));
    result = startArr.concat(result);

    const endBorder = time.maximizeDate(result[result.length - 1].start);
    if (endBorder > endDate) {
        result[result.length - 1].end = endDate;
    } else {
        const endArr = fill(result[result.length - 1].start, endDate, result[result.length - 1].status);
        result = result.concat(endArr);
    }

    return result;
}

// Returns Path to generated timezone-data
const toTimezonedFile = async (processedData, type) => {
    const timezonedData = processedData.map(el => {
        if (el.start) el.start = el.start.toLocaleString(history.LOCALE, {timeZone: history.TIMEZONE});
        if (el.end) el.end = el.end.toLocaleString(history.LOCALE, {timeZone: history.TIMEZONE});
        return el;
    });

    const stringifiedTimezonedData = JSON.stringify(timezonedData, null, '\t');
    const timezonedFile = filesystem.getTimezonedGraphDataPath(type);
    await fs.writeFile(timezonedFile, stringifiedTimezonedData, 'utf8');

    return timezonedFile;
}

function createGraphData(rawSortedData, type, startDate, endDate) {
    const processedData  = processGraphData(rawSortedData, startDate, endDate);
    return toTimezonedFile(processedData, type);
}

function createUnchangedGraphData(type, startDate, endDate, isAvailable) {
    const data = fill(startDate, endDate, availabilityToStatus(isAvailable));
    return toTimezonedFile(data, type);
}


module.exports = {
    createGraphData,
    createUnchangedGraphData
}