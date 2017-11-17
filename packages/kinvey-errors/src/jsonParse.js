const BaseError = require('./base');

function JSONParseError(message, debug, code, kinveyRequestId) {
  this.name = 'JSONParseError';
  this.message = message || 'Unable to parse the JSON in the request.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
JSONParseError.prototype = Object.create(BaseError.prototype);
JSONParseError.prototype.constructor = JSONParseError;
module.exports = JSONParseError;
