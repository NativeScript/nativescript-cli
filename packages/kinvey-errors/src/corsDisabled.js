const BaseError = require('./base');

function CORSDisabledError(message, debug, code, kinveyRequestId) {
  this.name = 'CORSDisabledError';
  this.message = message || 'Cross Origin Support is disabled for this application.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
CORSDisabledError.prototype = Object.create(BaseError.prototype);
CORSDisabledError.prototype.constructor = CORSDisabledError;
module.exports = CORSDisabledError;
