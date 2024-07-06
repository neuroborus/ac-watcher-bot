const { maximizeDate } = require('../utils/time');
const { getGraphDataPath, pathToUrl} = require('../utils/filesystem');
const { writeFileSync } = require('node:fs');

function processData(sortedAscData) {
    const result = sortedAscData.reduce((acc, cur, i) => {

        acc.push({
            start: cur.createdAt,
            status: cur.isAvailable ? 'ON' : 'OFF',
        })

        if (i > 0) {
            if (sortedAscData[i-1].createdAt.getDate() < cur.createdAt.getDate()) {
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

function writeGraphData(rawSortedData, type) {
    const processedData = processData(rawSortedData);
    const stringifiedData = JSON.stringify(processedData, null, '\t');
    const file = getGraphDataPath(type);

    writeFileSync(file, stringifiedData, 'utf8');

    return pathToUrl(file);
}

module.exports = {
    writeGraphData
}