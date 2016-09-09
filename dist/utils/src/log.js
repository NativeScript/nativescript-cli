'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Log = undefined;

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var originalFactory = _loglevel2.default.methodFactory;

/**
 * @private
 */
_loglevel2.default.methodFactory = function methodFactory(methodName, logLevel, loggerName) {
  var rawMethod = originalFactory(methodName, logLevel, loggerName);

  return function log(message) {
    message = 'Kinvey: ' + message;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (args.length > 0) {
      rawMethod(message, args);
    } else {
      rawMethod(message);
    }
  };
};

/**
 * @private
 */
_loglevel2.default.setDefaultLevel(_loglevel2.default.levels.SILENT);

/**
 * @private
 */
exports.Log = _loglevel2.default;