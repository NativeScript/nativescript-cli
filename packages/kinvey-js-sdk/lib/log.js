'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _loglevel = require('loglevel');

var log = _interopRequireWildcard(_loglevel);

var _loglevelPluginPrefix = require('loglevel-plugin-prefix');

var prefix = _interopRequireWildcard(_loglevelPluginPrefix);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Set the default log level to ERROR. This will not overwrite the log level
// if it has already been set.
log.setDefaultLevel(log.levels.ERROR);

// Register log with the prefix plugin
prefix.reg(log);

// Create a custom log prefix format
var logPrefix = {
  template: '[%t] %l (%n):',
  timestampFormatter: function timestampFormatter(date) {
    return date.toISOString();
  }
};
prefix.apply(log, logPrefix);

// Overrride the getLogger function to apply the custom log prefix format
var getLogger = log.getLogger;

log.getLogger = function getLoggerOverride(name) {
  var logger = getLogger(name);
  prefix.apply(logger, logPrefix);
  return logger;
};

// Export
exports.default = log;