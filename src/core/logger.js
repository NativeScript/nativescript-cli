// Define logger
var logger = log.noConflict();

// Prepend all log messages with 'Kinvey: '
var originalFactory = logger.methodFactory;
logger.methodFactory = function(methodName, logLevel) {
  var rawMethod = originalFactory(methodName, logLevel);

  return function(message) {
    message = 'Kinvey: ' + message;
    logger.history = logger.history || [];
    logger.history.push(message);
    rawMethod(message);
  };
};

Kinvey.log = {
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
