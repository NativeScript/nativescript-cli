const BaseError = require('./base');

function IncompleteRequestBodyError(message, debug, code, kinveyRequestId) {
  this.name = 'IncompleteRequestBodyError';
  this.message = message || 'The request body is either missing or incomplete.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
IncompleteRequestBodyError.prototype = Object.create(BaseError.prototype);
IncompleteRequestBodyError.prototype.constructor = IncompleteRequestBodyError;
module.exports = IncompleteRequestBodyError;
