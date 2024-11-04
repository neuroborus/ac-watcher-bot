const watcher = require('../configs/watcher.config');

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function minimizeDate(date) {
    const newDate = new Date(date); // copy
    newDate.setHours(0);
    newDate.setMinutes(0);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
}

function maximizeDate(date) {
    const newDate = new Date(date); // copy
    newDate.setHours(23);
    newDate.setMinutes(59);
    newDate.setSeconds(59);
    newDate.setMilliseconds(999);
    return newDate;
}

function plusDay(date, days = 1) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days); // Will automatically switch on the next month
    return newDate;
}

function maximizedYesterday() {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return maximizeDate(yesterday);
}

const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const daysInMs = (daysInMonth) => DAY_IN_MS * daysInMonth;

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

const SCHEDULE_CYCLE_MS = watcher.REPEATABLE_WEEKS * WEEK_IN_MS;
const START_TO_END_APPROVING_MS = 1000 * 60 * watcher.PING_EVERY_MINUTES * (watcher.PINGS_TO_APPROVE - 1);

function approveAgo(date) {
    return new Date(date.getTime() - START_TO_END_APPROVING_MS);
}

module.exports = {
    sleep,
    maximizeDate,
    minimizeDate,
    plusDay,
    maximizedYesterday,
    daysInMs,
    daysInMonth,
    approveAgo,
    WEEK_IN_MS,
    SCHEDULE_CYCLE_MS
};
