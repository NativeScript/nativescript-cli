import log from 'loglevel';

let Logger = {
  trace: (statement) => {
    log.trace(statement);
  },

  debug: (statement) => {
    log.debug(statement);
  },

  info: (statement) => {
    log.info(statement);
  },

  warn: (statement) => {
    log.warn(statement);
  },

  error: (statement) => {
    log.error(statement);
  },

  setLevel(level, persist) {
    log.setLevel(level, persist);
  },

  enableAll() {
    log.enableAll();
  },

  disableAll() {
    log.disableAll();
  }
};

export default Logger;
