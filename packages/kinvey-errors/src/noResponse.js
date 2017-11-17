const BaseError = require('./base');

function NoResponseError(message, debug, code, kinveyRequestId) {
  this.name = 'NoResponseError';
  this.message = message || 'No response was provided.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
NoResponseError.prototype = Object.create(BaseError.prototype);
NoResponseError.prototype.constructor = NoResponseError;
module.exports = NoResponseError;
