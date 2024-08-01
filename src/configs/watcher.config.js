const PING_EVERY_MINUTES = 1;
const PING_PATTERN = `55 */${PING_EVERY_MINUTES} * * * *`; // At second 55

module.exports = {
    HERE: 'Watcher',
    PING_EVERY_MINUTES,
    PING_PATTERN,
    EVERY_WEEK_PATTERN: '1 0 * * 1',
    EVERY_MONTH_PATTERN: '1 0 1 * *',
    FOLDER_NAME: 'ac-watcher',
    REPEATABLE_WEEKS: process.env.SCHEDULE_REPEATABLE_WEEKS || 1,
    PREDICTION: process.env.IS_PREDICTION === 'true',
    PINGS_TO_APPROVE: 2, // Short circuit happens sometimes for 1 minute
    SKIP_TIME: [ // Router reboots at 3 AM
        {
            HOUR: 3,
            MINUTE: 0
        },
        {
            HOUR: 3,
            MINUTE: 1
        },
        {
            HOUR: 3,
            MINUTE: 2
        }
    ]
};
