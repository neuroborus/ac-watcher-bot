const fs = require('node:fs/promises');
const {spawn} = require('node:child_process');
const path = require('node:path');
const time = require('../../tools/time');
const mongo = require('../mongo.service');
const processor = require('./history-processor');
const history = require('../../configs/history.config');

function plotInChildProcess(dataPath, type) {
    return new Promise((resolve, reject) => {
        const script = path.join(__dirname, 'plot-graph-child.js');
        const child = spawn(process.execPath, [script, dataPath, type], {
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => {
            stdout += chunk;
        });
        child.stderr.on('data', (chunk) => {
            stderr += chunk;
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
                return;
            }
            reject(new Error(`plotInChildProcess() -=> exit ${code}: ${stderr}`));
        });
    });
}

// Returns graph image path
async function createGraph(type, nowDate) {
    let gte;
    const lte = nowDate.getTime();
    switch (type) {
        case history.SAMPLE.WEEK:
            gte = lte - time.WEEK_IN_MS + 1;
            break;
        case history.SAMPLE.MONTH:
            const date = new Date(lte);
            const days = time.daysInMonth(date.getMonth(), date.getFullYear());
            gte = lte - time.daysInMs(days) + 1;
            break;
        default:
            return;
    }

    const rawSortedData = await mongo.findHistoriesAsc(gte, lte);
    let dataPath;
    if (rawSortedData.length) {
        dataPath = await processor.createGraphData(rawSortedData, type, new Date(gte), nowDate);
    } else {
        const prevStatus = await mongo.getLastHistory();
        dataPath = await processor.createUnchangedGraphData(
            type,
            new Date(gte),
            nowDate,
            prevStatus?.isAvailable ?? true
        );
    }

    const graph = await plotInChildProcess(dataPath, type);
    await fs.rm(dataPath);
    return graph;
}

async function checkForNextChange(changeDate, isAvailable, epsilon = history.TIME_EPSILON) {
    const nearestDate = new Date(changeDate.getTime() - time.SCHEDULE_CYCLE_MS + epsilon);
    const templateEl = await mongo.getNextHistory(nearestDate);
    if (!templateEl || templateEl.isAvailable === isAvailable) return undefined;

    return new Date(new Date(templateEl.createdAt).getTime() + time.SCHEDULE_CYCLE_MS);
}

module.exports = {
    createGraph,
    checkForNextChange
}