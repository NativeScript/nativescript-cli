import BaseError from './base';

function ActiveUserError(message, debug, code, kinveyRequestId) {
  this.name = 'ActiveUserError';
  this.message = message || 'An active user already exists.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
ActiveUserError.prototype = Object.create(BaseError.prototype);
ActiveUserError.prototype.constructor = ActiveUserError;
export default ActiveUserError;

