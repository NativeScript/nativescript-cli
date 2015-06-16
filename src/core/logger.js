let Logger = {
  log: () => {
    console.log(...arguments);
  },

  debug: () => {
    console.log(...arguments);
  },

  verbose: () => {
    console.log(...arguments);
  },

  info: () => {
    console.log(...arguments);
  },

  warn: () => {
    console.log(...arguments);
  },

  error: () => {
    console.error(...arguments);
  }
};

export default Logger;
