const BaseError = require('./base');

function NoActiveUserError(message, debug, code, kinveyRequestId) {
  this.name = 'NoActiveUserError';
  this.message = message || 'There is not an active user.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
NoActiveUserError.prototype = Object.create(BaseError.prototype);
NoActiveUserError.prototype.constructor = NoActiveUserError;
module.exports = NoActiveUserError;
