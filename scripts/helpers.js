const path = require('path');
const fs = require('fs-extra');

const rootPath = path.resolve(__dirname, '..');

function root(...args) {
  return path.join(rootPath, ...args);
}

function copyFile(file, dest) {
  return fs.ensureDir(path.dirname(dest))
    .then(() => fs.copyFile(file, dest));
}

module.exports = {
  root,
  copyFile
};
