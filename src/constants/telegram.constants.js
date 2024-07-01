const COMMANDS_INFO = ' (If there is no response, the file may be empty) ';

module.exports = {
  MAX_MSG_SIZE: 4096,
  RETRIES: 2, // Newer version of Telegraf uses out-of-box retry mechanism and it is uncontrollable
  RETRY_DELAY_MS: 30000,
  REQUESTS_PAUSE_MS: 2000,
  COMMANDS: [
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
  ]
};
