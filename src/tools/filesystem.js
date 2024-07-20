const fs = require('node:fs');
const {join} = require('node:path');
const {tmpdir} = require('node:os');

const {FOLDER_NAME} = require('../configs/watcher.config');

function createFilePath(filename) {
    return join(tmpdir(), filename);
}

function getLogsPath(level, extension = 'log') {
    const path = join(tmpdir(), FOLDER_NAME, 'logs');
    syncPath(path);
    return join(path, `${level}.${extension}`);
}

function getGraphPath(type, extension = 'svg') {
    const path = join(tmpdir(), FOLDER_NAME, 'graphs');
    syncPath(path);
    return join(path, `${type}.${extension}`);
}

function getHistoryDataPath(type, extension = 'json') {
    const path = join(tmpdir(), FOLDER_NAME, 'graphs-data');
    syncPath(path);
    return join(path, `${type}.${extension}`);
}

function getTimezonedGraphDataPath(type, extension = 'json') {
    const path = join(tmpdir(), FOLDER_NAME, 'graphs-data');
    syncPath(path);
    return join(path, `${type}-tz.${extension}`);
}

function pathToUrl(path) {
    return `file://${path}`;
}

function syncPath(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {recursive: true});
    }
    return path;
}

module.exports = {
    createFilePath,
    getLogsPath,
    getGraphPath,
    getGraphDataPath: getHistoryDataPath,
    getTimezonedGraphDataPath,
    pathToUrl,
    syncPath,
};
