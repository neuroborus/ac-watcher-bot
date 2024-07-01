const { Telegraf } = require('telegraf');
const fs = require('fs');
const tgConstants = require('../constants/telegram.constants');
const { formHtmlTagsMessage,
  addEmojiPrefix, formNotify
} = require('../utils/messages');
const { sleep } = require('../utils/time');
const filesystem = require('../utils/filesystem');
const { USERS, ADMIN, GROUP } = require('../constants/watcher.constants');
const {
  TELEGRAM_BOT_TOKEN,
} = process.env;

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const me = (ctx) => ctx.reply(`PONG: user=${ctx?.from?.id} | chat=${ctx?.update?.message?.chat?.id}`);

const sendLogFile = async (layer, ctx) => {
  if (ctx?.from?.id !== ADMIN) {
    await ctx.reply('You are not an admin!');
    return;
  }
  layer = layer.toLowerCase();
  const document =  {
    source: filesystem.getLogsPath(layer),
    filename: layer + '.log',
  }
  await bot.telegram.sendDocument(ctx.from.id, document);
};
const trace = async (ctx) => await sendLogFile('trace', ctx);
const debug = async (ctx) => await sendLogFile('debug', ctx);
const info = async (ctx) => await sendLogFile('info', ctx);
const warn = async (ctx) => await sendLogFile('warn', ctx);
const error = async (ctx) => await sendLogFile('error', ctx);
const logs = async (ctx) => await sendLogFile('logs', ctx);

bot.start(me);
bot.command('me', me);

bot.command('trace', trace);
bot.command('debug', debug);
bot.command('info', info);
bot.command('warn', warn);
bot.command('error', error);
bot.command('logs', logs);


function startBot () {
  bot.catch(async (err, ctx) => {
    console.error('Telegram bot caught error -> ' + err);
  });
  bot.telegram.setMyCommands(tgConstants.COMMANDS)
    .catch(e => console.error(e));
  bot.launch()
    .then(r => console.log('Bot started!'))
    .catch(e => console.error(e));
}

async function sendMessage (msg, recipient, options = {}, attempt = 0) {
  let isSizeWell = true;
  let filepath = '';
  let document = '';

  try {
    await sleep(tgConstants.REQUESTS_PAUSE_MS);
    if (tgConstants.MAX_MSG_SIZE <= msg.length) {
      isSizeWell = false;
      const prefix = options?.disable_notification ? 'ERROR__' : 'FATAL__';
      const filename = prefix + new Date().toISOString() + '.html';
      filepath = filesystem.createFilePath(filename);
      fs.writeFileSync(filepath, msg);
      document = {
        source: filepath,
        filename
      };
      console.debug(filename + ' ' + filepath);
    }

    try {
      if (isSizeWell) {
        await bot.telegram.sendMessage(
          recipient,
          msg,
          { parse_mode: 'HTML', ...options }
        );
      } else {
        await bot.telegram.sendDocument(recipient, document);
      }
    } catch (e) {
      console.error(
          `[${recipient}] ` +
        `[${attempt}/${tgConstants.RETRIES}] Sending message: ${e}`
      );
      if (attempt < tgConstants.RETRIES) {
        setTimeout(async () => {
          await sendMessage(msg, recipient, options, attempt + 1);
        }, tgConstants.RETRY_DELAY_MS);
      }
    }

    if (filepath) {
      fs.unlinkSync(filepath);
    }
  } catch (e) {
    console.error(
        `[${recipient}] ` +
      'sendMessage -> ' +
      e
    );
  }
}

async function infoAdmin (what, where, level, logUrl) {
  const msg = formHtmlTagsMessage(where, what, level, logUrl);
  await sendMessage(
    addEmojiPrefix(msg,  level, false),
      ADMIN,
    { disable_notification: true }
  );
}

async function alertAdmin (what, where, level, logUrl) {
  const msg = formHtmlTagsMessage(where, what, level, logUrl);
  await sendMessage(
    addEmojiPrefix(msg, level, true),
      ADMIN,
    { disable_notification: false }
  );
}

async function notifyAboutStatus (status) {
  const recipients = [];
  recipients.push(ADMIN);
  recipients.push(GROUP);
  recipients.concat(USERS);
  const msg = formNotify(status);

  for (const recipient of recipients) {
    await sendMessage(msg, recipient, { disable_notification: true });
  }
}



module.exports = {
  startBot,
  infoAdmin,
  alertAdmin,
  sendLogFile,
  notifyAboutStatus
};
