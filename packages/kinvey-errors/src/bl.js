const BaseError = require('./base');

function BLError(message, debug, code, kinveyRequestId) {
  this.name = 'BLError';
  this.message = message || 'The Business Logic script did not complete.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
BLError.prototype = Object.create(BaseError.prototype);
BLError.prototype.constructor = BLError;
module.exports = BLError;
