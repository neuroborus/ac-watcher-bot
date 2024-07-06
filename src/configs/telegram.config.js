const {
    TG_ADMIN_ID,
    TG_CHANNEL_ID,
    TG_USERS_IDS,
    TG_GROUPS_IDS,
    IS_NOTIFY_ADMIN,
    IS_PIN_STATUS_IN_GROUPS,
    IS_ADMIN_NOTIFY_WITH_SOUND,
    IS_CHANNEL_NOTIFY_WITH_SOUND,
    IS_USERS_NOTIFY_WITH_SOUND,
    IS_GROUPS_NOTIFY_WITH_SOUND
} = process.env;

const COMMANDS_INFO = ' (If there is no response, the file may be empty) ';

module.exports = {
    MAX_MSG_SIZE: 4096,
    RETRIES: 2, // Newer version of Telegraf uses out-of-box retry mechanism and it is uncontrollable
    RETRY_DELAY_MS: 30000,
    REQUESTS_PAUSE_MS: 500,
    COMMANDS: [
        {
            command: 'status',
            description: 'Get current status',
        },
        {
            command: 'me',
            description: 'User & chat info, service health',
        },
        {
            command: 'trace',
            description: 'Get TRACE level inner(!) logs' + COMMANDS_INFO,
        },
        {
            command: 'debug',
            description: 'Get DEBUG level inner(!) logs' + COMMANDS_INFO,
        },
        {
            command: 'info',
            description: 'Get INFO level inner(!) logs' + COMMANDS_INFO,
        },
        {
            command: 'warn',
            description: 'Get WARN level inner(!) logs' + COMMANDS_INFO,
        },
        {
            command: 'error',
            description: 'Get ERROR level inner(!) logs' + COMMANDS_INFO,
        },
        {
            command: 'logs',
            description: 'Get ALL levels inner(!) logs' + COMMANDS_INFO,
        }
    ],
    ADMIN: parseInt(TG_ADMIN_ID, 10),
    CHANNEL: parseInt(TG_CHANNEL_ID, 10),
    GROUPS: (
        TG_GROUPS_IDS ? TG_GROUPS_IDS.split(",") : []
    ).map(item => parseInt(item, 10)),
    USERS: (
        TG_USERS_IDS ? TG_USERS_IDS.split(",") : []
    ).map(item => parseInt(item, 10)),
    NOTIFY_ADMIN: IS_NOTIFY_ADMIN === 'true',
    PIN_STATUS_IN_GROUPS: IS_PIN_STATUS_IN_GROUPS === 'true',
    ADMIN_NOTIFY_WITH_SOUND: IS_ADMIN_NOTIFY_WITH_SOUND === 'true',
    CHANNEL_NOTIFY_WITH_SOUND: IS_CHANNEL_NOTIFY_WITH_SOUND === 'true',
    USERS_NOTIFY_WITH_SOUND: IS_USERS_NOTIFY_WITH_SOUND === 'true',
    GROUPS_NOTIFY_WITH_SOUND: IS_GROUPS_NOTIFY_WITH_SOUND === 'true',
};
