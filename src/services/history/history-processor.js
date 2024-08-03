const fs = require('node:fs/promises');
const history = require('../../configs/history.config');
const time = require('../../tools/time');
const filesystem = require('../../tools/filesystem');

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

function processGraphData(sortedAscData, nowDate) {
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
            status: cur.isAvailable ? 'ON' : 'OFF',
        });
        return acc;
    }, []);

    // result[0].start = time.minimizeDate(result[0].start);
    const endBorder = time.maximizeDate(result[result.length - 1].start);
    if (endBorder > nowDate) {
        result[result.length - 1].end = nowDate;
    } else {
        const subArr = fill(result[result.length - 1].start, nowDate, result[result.length - 1].status);
        result = result.concat(subArr);
    }

    return result;
}

// Returns Path to generated timezone-data
async function createGraphData(rawSortedData, type, nowDate) {
    const processedData = processGraphData(rawSortedData, nowDate);
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


module.exports = {
    createGraphData
}