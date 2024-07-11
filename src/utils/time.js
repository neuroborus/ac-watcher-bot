const {REPEATABLE_WEEKS} = require('../configs/watcher.config');

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function minimizeDate(date) {
    const newDate = new Date(date); // copy object
    newDate.setHours(0);
    newDate.setMinutes(0);
    newDate.setSeconds(1);
    return newDate;
}

function maximizeDate(date) {
    const newDate = new Date(date); // copy object
    newDate.setHours(23);
    newDate.setMinutes(59);
    newDate.setSeconds(59);
    return newDate;
}

function maximizedYesterday() {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return maximizeDate(yesterday);
}

const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;
const daysInMs = (daysInMonth) => 1000 * 60 * 60 * 24 * daysInMonth;

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

const SCHEDULE_CYCLE_MS = REPEATABLE_WEEKS * WEEK_IN_MS;

module.exports = {
    sleep,
    maximizeDate,
    minimizeDate,
    maximizedYesterday,
    WEEK_IN_MS,
    daysInMs,
    daysInMonth,
    SCHEDULE_CYCLE_MS
};
