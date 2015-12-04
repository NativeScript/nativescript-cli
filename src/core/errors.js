const util = require('util');
const isFunction = require('lodash/lang/isFunction');

Error.extend = function(name) {
  const SubType = function(message, debug) {
    if (!(this instanceof SubType)) {
      return new SubType(message, debug);
    }

    this.name = name;
    this.message = message;
    this.description = message;
    this.debug = debug;

    if (isFunction(Error.captureStackTrace)) {
      Error.captureStackTrace(this, this.constructor);
    }
  };

  util.inherits(SubType, this);

  SubType.prototype.toString = function() {
    return `${this.name}: ${util.inspect(this.message)}`;
  };

  SubType.extend = this.extend;
  return SubType;
};

module.exports = {
  ActiveUserError: Error.extend('ActiveUserError'),
  AlreadyLoggedInError: Error.extend('AlreadyLoggedInError'),
  BlobNotFoundError: Error.extend('BlobNotFoundError'),
  KinveyError: Error.extend('KinveyError'),
  NotFoundError: Error.extend('NotFoundError'),
  UserNotFoundError: Error.extend('UserNotFoundError')
};
