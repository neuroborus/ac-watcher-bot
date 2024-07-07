module.exports = {
    MONGO_CONNECTED: process.env.IS_MONGO_CONNECTED === 'true',
    MONGO_SESSIONS: process.env.IS_MONGO_SESSIONS === 'true',
    MONGO_URL: process.env.MONGO_URL,
    HISTORY_TTL: 60 * 60 * 24 * 30 * 12, // 12 months
}