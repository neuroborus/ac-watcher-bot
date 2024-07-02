const { Telegraf } = require('telegraf');
const fs = require('fs');
const tgConstants = require('../constants/telegram.constants');
const { formHtmlTagsMessage,
  addEmojiPrefix, formNotify
} = require('../utils/messages');
const { sleep } = require('../utils/time');
const filesystem = require('../utils/filesystem');
const { ADMIN, USERS, GROUPS, PIN_STATUS_IN_GROUPS } = require('../constants/telegram.constants');
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

/////////////////////////// MESSAGING

async function sendMessage (msg, recipient, options = {}, attempt = 0) {
  let isSizeWell = true;
  let filepath = '';
  let document = '';
  let message;

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
        message = await bot.telegram.sendMessage(
          recipient,
          msg,
          { parse_mode: 'HTML', ...options }
        );
      } else {
        message = await bot.telegram.sendDocument(recipient, document);
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
  return message?.message_id;
}


async function deleteMessageWithRetries (msgId, chatId, attempt = 0) {
  if (attempt <= tgConstants.RETRIES) {
    try {
      await sleep(tgConstants.REQUESTS_PAUSE_MS);
      await bot.telegram.deleteMessage(chatId, msgId);
    } catch (e) {
      await alertAdmin(
          `deleteMessageWithRetries [${msgId}][${attempt}/${
              tgConstants.RETRIES
          }] => ` + e,
          'deleteMessageWithRetries',
      );
      await deleteMessageWithRetries(msgId, chatId, attempt + 1);
    }
  }
}

async function pinMessageWithRetries (msgId, chatId, options = {}, attempt = 0) {
  if (attempt <= tgConstants.RETRIES) {
    try {
      await sleep(tgConstants.REQUESTS_PAUSE_MS);
      await bot.telegram.pinChatMessage(chatId, msgId, options);
    } catch (e) {
      await alertAdmin(
          `pinMessageWithRetries [${msgId}][${attempt}/${
              tgConstants.RETRIES
          }] => ` + e,
          'pinMessageWithRetries',
      );
      await pinMessageWithRetries(msgId, chatId, options, attempt + 1);
    }
  }
}


/////////////////////////////// WRAPPERS

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

let previousGroupsMessages = new Map(); // groupId - messageID
async function notifyAboutStatus (status) {
  const users = USERS;
  users.unshift(ADMIN);

  const msg = formNotify(status);
  for (const user of users) {
    await sendMessage(msg, user, { disable_notification: true });
  }

  for (const group of GROUPS) {
    const prevMsgId = previousGroupsMessages.get(group);
    const newMsgId = await sendMessage(msg, group, { disable_notification: true });
    if (prevMsgId) await deleteMessageWithRetries(prevMsgId, group);
    previousGroupsMessages.set(group, newMsgId);
    if (PIN_STATUS_IN_GROUPS) {
      await pinMessageWithRetries(newMsgId, group, { disable_notification: true });
    }
  }
}



module.exports = {
  startBot,
  infoAdmin,
  alertAdmin,
  sendLogFile,
  notifyAboutStatus
};
