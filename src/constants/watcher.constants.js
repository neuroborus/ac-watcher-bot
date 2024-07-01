const { USERS_LIST, ADMIN_ID, GROUP_ID } = process.env;

module.exports = {
  HERE: 'Watcher',
  PING_PATTERN: '* * * * *',
  ADMIN: parseInt(ADMIN_ID, 10),
  GROUP: parseInt(GROUP_ID, 10),
  USERS: (
      USERS_LIST ? USERS_LIST.split(",") : []
  ).map(item => parseInt(item, 10)),
};
