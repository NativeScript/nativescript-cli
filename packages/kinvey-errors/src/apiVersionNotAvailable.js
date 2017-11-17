const BaseError = require('./base');

function APIVersionNotAvailableError(message, debug, code, kinveyRequestId) {
  this.name = 'APIVersionNotAvailableError';
  this.message = message || 'This API version is not available for your app.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
APIVersionNotAvailableError.prototype = Object.create(BaseError.prototype);
APIVersionNotAvailableError.prototype.constructor = APIVersionNotAvailableError;
module.exports = APIVersionNotAvailableError;
