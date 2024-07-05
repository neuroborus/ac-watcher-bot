const { maximizeDate, dateToTimezone} = require('../utils/time');
const { getGraphDataPath, pathToUrl} = require('../utils/filesystem');
const { writeFileSync } = require('node:fs');

function processData(data) {
    const result = data.reduce((acc, cur, i) => {

        acc.push({
            start: cur.createdAt,
            status: cur.isAvailable ? 'ON' : 'OFF',
        })

        if (i > 0) {
            if (data[i-1].createdAt.getDate() < cur.createdAt.getDate()) {
                acc[i-1].end = maximizeDate(acc[i-1].start);
            } else {
                acc[i-1].end = cur.createdAt;
            }
        }
        return acc;
    }, []);
    result[result.length-1].end = maximizeDate(result[result.length-1].start);

    return result;
}

function writeGraphData(rawData, type) {
    const processedData = processData(rawData);
    const stringifiedData = JSON.stringify(processedData, null, '\t');
    const file = getGraphDataPath(type);

    writeFileSync(file, stringifiedData, 'utf8');

    return pathToUrl(file);
}

module.exports = {
    writeGraphData
}