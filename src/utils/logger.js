const fs = require ('fs');
const { getLogsPath } = require('./filesystem');

let traceFile;
let debugFile;
let infoFile;
let warnFile;
let errorFile;
let logsFile;

function refineMessage(msg, layer = '') {
  layer = layer ? ' | ' + layer : '';
  return new Date().toISOString() +
    layer +
    ' >>> ' + msg +
    ' <<<\n';
}

function runStreams() {
  traceFile = fs.createWriteStream(
      getLogsPath('trace'),
      {flags : 'a'}
    );
  debugFile = fs.createWriteStream(
    getLogsPath('debug'),
      {flags : 'a'}
    );
  infoFile = fs.createWriteStream(
    getLogsPath('info'),
    {flags : 'a'}
  );
  warnFile = fs.createWriteStream(
    getLogsPath('warn'),
    {flags : 'a'}
  );
  errorFile = fs.createWriteStream(
    getLogsPath('error'),
    {flags : 'a'}
  );
  logsFile = fs.createWriteStream(
    getLogsPath('logs'),
    {flags : 'a'}
  );
}

function closeStreams() {
  traceFile.end();
  debugFile.end();
  infoFile.end();
  warnFile.end();
  errorFile.end();
  logsFile.end();
}

function clearLogs() {
  closeStreams();
  fs.unlinkSync(getLogsPath('trace'));
  fs.unlinkSync(getLogsPath('debug'));
  fs.unlinkSync(getLogsPath('info'));
  fs.unlinkSync(getLogsPath('warn'));
  fs.unlinkSync(getLogsPath('error'));
  fs.unlinkSync(getLogsPath('logs'));
  runStreams();
}

function streamReplacement(file, layer) {
  return function (message) {
    message = refineMessage(message, layer);
    if (file.writable) file.write(message);
    if (logsFile.writable) logsFile.write(message);
    process.stdout.write(message);
  }
}

function inject() {
  runStreams();

  console.trace = streamReplacement(traceFile, 'TRACE');
  console.debug = streamReplacement(debugFile, 'DEBUG');
  console.log = streamReplacement(infoFile, 'INFO');
  console.warn = streamReplacement(warnFile, 'WARN');
  console.error = streamReplacement(errorFile, 'ERROR');
}

module.exports = {
  inject,
  clearLogs,
}
