import util from 'util';
import isFunction from 'lodash/isFunction';

/**
 * @private
 */
Error.extend = function extend(name) {
  const SubType = function SubType(message, debug) {
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

  SubType.prototype.toString = function toString() {
    return `${this.name}: ${util.inspect(this.message)}`;
  };

  SubType.extend = this.extend;
  return SubType;
};

export const ActiveUserError = Error.extend('ActiveUserError');
export const InsufficientCredentialsError = Error.extend('InsufficientCredentialsError');
export const InvalidCredentialsError = Error.extend('InvalidCredentialsError');
export const KinveyError = Error.extend('KinveyError');
export const NetworkConnectionError = Error.extend('NetworkConnectionError');
export const NotFoundError = Error.extend('NotFoundError');
export const NoResponseError = Error.extend('NoResponseError');
