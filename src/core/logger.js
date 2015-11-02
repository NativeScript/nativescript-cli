const log = require('loglevel');

class Logger {
  static get levels() {
    return log.levels;
  }

  static setLevel(level, persist) {
    log.setLevel(level, persist);
    return this;
  }

  static setDefaultLevel(level) {
    log.setDefaultLevel(level);
    return this;
  }

  static enableAll() {
    log.enableAll();
    return this;
  }

  static disableAll() {
    log.disableAll();
    return this;
  }

  static getLevel() {
    return log.getLevel();
  }
}

module.exports = Logger;
