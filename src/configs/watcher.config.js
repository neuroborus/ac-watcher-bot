module.exports = {
    HERE: 'Watcher',
    PING_PATTERN: '55 * * * * *', // At second 55
    EVERY_WEEK_PATTERN: '1 0 * * 1',
    EVERY_MONTH_PATTERN: '1 0 1 * *',
    FOLDER_NAME: 'ac-watcher',
    REPEATABLE_WEEKS: process.env.SCHEDULE_REPEATABLE_WEEKS || 1,
    PREDICTION: process.env.IS_PREDICTION === 'true',
};
