const { join } = require('path');
const { tmpdir } = require('os');
const fs = require ('fs');

function createFilePath(filename) {
  return join(tmpdir(), filename);
}

function getLogsPath(level, extension = 'log') {
  const path = join(tmpdir(), 'ac-watcher-logs');
  syncPath(path);
  return join(path, `${level}.${extension}`);
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
