const BaseError = require('./base');

function KinveyInternalErrorRetry(message, debug, code, kinveyRequestId) {
  this.name = 'KinveyInternalErrorRetry';
  this.message = message || 'The Kinvey server encountered an unexpected error. Please retry your request.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
KinveyInternalErrorRetry.prototype = Object.create(BaseError.prototype);
KinveyInternalErrorRetry.prototype.constructor = KinveyInternalErrorRetry;
module.exports = KinveyInternalErrorRetry;
