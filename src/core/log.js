Kinvey.Log = {
  levels: logger.levels,

  getLevel: function() {
    return logger.getLevel();
  },

  setLevel: function(level, persist) {
    logger.setLevel(level, persist);
  },

  setDefaultLevel: function(level) {
    logger.setDefaultLevel(level);
  },

  enableAll: function(persist) {
    logger.enableAll(persist);
  },

  disableAll: function(persist) {
    logger.disableAll(persist);
  }
};

// Set the default level to Kinvey.Log.levels.ERROR
Kinvey.Log.setDefaultLevel(Kinvey.Log.levels.ERROR);
