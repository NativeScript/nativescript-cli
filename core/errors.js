'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NoResponseError = exports.NotFoundError = exports.NetworkConnectionError = exports.KinveyError = exports.InvalidCredentialsError = exports.InsufficientCredentialsError = exports.ActiveUserError = undefined;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @private
 */
Error.extend = function extend(name) {
  var SubType = function SubType(message, debug) {
    if (!(this instanceof SubType)) {
      return new SubType(message, debug);
    }

    this.name = name;
    this.message = message;
    this.description = message;
    this.debug = debug;

    if ((0, _isFunction2.default)(Error.captureStackTrace)) {
      Error.captureStackTrace(this, this.constructor);
    }
  };

  _util2.default.inherits(SubType, this);

  SubType.prototype.toString = function toString() {
    return this.name + ': ' + _util2.default.inspect(this.message);
  };

  SubType.extend = this.extend;
  return SubType;
};

var ActiveUserError = exports.ActiveUserError = Error.extend('ActiveUserError');
var InsufficientCredentialsError = exports.InsufficientCredentialsError = Error.extend('InsufficientCredentialsError');
var InvalidCredentialsError = exports.InvalidCredentialsError = Error.extend('InvalidCredentialsError');
var KinveyError = exports.KinveyError = Error.extend('KinveyError');
var NetworkConnectionError = exports.NetworkConnectionError = Error.extend('NetworkConnectionError');
var NotFoundError = exports.NotFoundError = Error.extend('NotFoundError');
var NoResponseError = exports.NoResponseError = Error.extend('NoResponseError');