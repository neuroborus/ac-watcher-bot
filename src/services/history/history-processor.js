const fs = require('node:fs/promises');
const history = require('../../configs/history.config');
const time = require('../../tools/time');
const filesystem = require('../../tools/filesystem');

function processGraphData(sortedAscData, nowDate) {
    const result = sortedAscData.reduce((acc, cur) => {
        const size = acc.length;
        const lastInd = size - 1;
        if (size > 0) {
            if (acc[lastInd].start.getDate() < cur.createdAt.getDate()) {
                acc[lastInd].end = time.maximizeDate(acc[lastInd].start);
                acc.push({
                    start: time.minimizeDate(cur.createdAt),
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

    // result[0].start = time.minimizeDate(result[0].start);
    const endBorder = time.maximizeDate(result[result.length - 1].start);
    if (endBorder > nowDate) {
        result[result.length - 1].end = nowDate;
    } else {
        result[result.length - 1].end = endBorder;
        const lastHist = {...result[result.length - 1]};
        lastHist.start = time.minimizeDate(nowDate);
        lastHist.end = nowDate;
        result.push(lastHist);
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