const { join } = require('path');
const { tmpdir } = require('os');
const fs = require ('fs');

function createFilePath(filename) {
  return join(tmpdir(), filename);
}

function getLogsPath(level) {
  const path = join(tmpdir(), 'retranslator-logs');
  syncPath(path);
  return join(path, `${level}.log`);
}

function syncPath(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  return path;
}

module.exports = {
  createFilePath,
  getLogsPath,
  syncPath,
};
