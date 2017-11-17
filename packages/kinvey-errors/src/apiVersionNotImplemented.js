const BaseError = require('./base');

function APIVersionNotImplementedError(message, debug, code, kinveyRequestId) {
  this.name = 'APIVersionNotImplementedError';
  this.message = message || 'This API version is not implemented.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
APIVersionNotImplementedError.prototype = Object.create(BaseError.prototype);
APIVersionNotImplementedError.prototype.constructor = APIVersionNotImplementedError;
module.exports = APIVersionNotImplementedError;
