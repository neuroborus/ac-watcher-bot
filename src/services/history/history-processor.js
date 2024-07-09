const fs = require('node:fs');
const history = require('../../configs/history.config');
const time = require('../../utils/time');
const filesystem = require('../../utils/filesystem');

function processData(sortedAscData) {
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
    const nowDate = new Date();
    let endBorder = time.maximizeDate(result[result.length-1].start);
    endBorder = endBorder > nowDate ? nowDate : endBorder;
    result[result.length-1].end = endBorder;

    return result;
}

function writeHistoryData(rawSortedData, type) {
    const processedData = processData(rawSortedData);
    const timezonedData = processedData.map(el => {
        if (el.start) el.start = el.start.toLocaleString(history.LOCALE, {timeZone: history.TIMEZONE});
        if (el.end) el.end = el.end.toLocaleString(history.LOCALE, {timeZone: history.TIMEZONE});
        return el;
    })

    const stringifiedData = JSON.stringify(processedData, null, '\t');
    const stringifiedTimezonedData = JSON.stringify(timezonedData, null, '\t');

    const timezonedFile = filesystem.getTimezonedGraphDataPath(type)
    fs.writeFileSync(filesystem.getGraphDataPath(type), stringifiedData, 'utf8');
    fs.writeFileSync(timezonedFile, stringifiedTimezonedData, 'utf8');

    return filesystem.pathToUrl(timezonedFile);
}




function checkForNextNearChanges(changeDate, isAvailable) {
    let data;
    try {
        data = require(filesystem.getGraphDataPath(history.SAMPLE.WEEK));
    } catch (err) {
        console.warn("can't open week data: " + err);
        return null;
    }

    const templateEl = getTemplateEl(data, changeDate, isAvailable);
    if (!templateEl) return undefined;

    return new Date(new Date(templateEl.end).getTime() + time.WEEK_IN_MS);
}
// Tools
const getTemplateEl = (data, changeDate, isAvailable) => {
    let templateEl;
    for(let i = 0; i < data.length; i++) {
        const el = data[i];
        if (isTemplateEl(el, changeDate, isAvailable)) {
            if (data.length > i && data[i+1].status === el.status) {
                templateEl = data[i+1];
            }
            templateEl = el;
            break;
        }
        if (new Date(el.start).getTime() > changeDate.getTime() - time.WEEK_IN_MS) break;
    }
    return templateEl;
}
const isTemplateEl = (el, changeDate, isAvailable) => {
    return (isAvailable ? 'ON' : 'OFF') === el.status &&
        new Date(el.start).getTime() - history.TIME_EPSILON < changeDate.getTime() - time.WEEK_IN_MS &&
        new Date(el.end).getTime() > changeDate.getTime() - time.WEEK_IN_MS;
}

module.exports = {
    writeHistoryData,
    checkForNextNearChanges
}