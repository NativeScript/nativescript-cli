"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var log = _interopRequireWildcard(require("loglevel"));

var prefix = _interopRequireWildcard(require("loglevel-plugin-prefix"));

// Set the default log level to ERROR. This will not overwrite the log level
// if it has already been set.
log.setDefaultLevel(log.levels.ERROR); // Register log with the prefix plugin

prefix.reg(log); // Create a custom log prefix format

var logPrefix = {
  template: '[%t] %l (%n):',
  timestampFormatter: function timestampFormatter(date) {
    return date.toISOString();
  }
};
prefix.apply(log, logPrefix); // Overrride the getLogger function to apply the custom log prefix format

var getLogger = log.getLogger;

log.getLogger = function getLoggerOverride(name) {
  var logger = getLogger(name);
  prefix.apply(logger, logPrefix);
  return logger;
}; // Export


var _default = log;
exports.default = _default;