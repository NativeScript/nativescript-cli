const BaseError = require('./base');

function KinveyInternalErrorStop(message, debug, code, kinveyRequestId) {
  this.name = 'KinveyInternalErrorStop';
  this.message = message || 'The Kinvey server encountered an unexpected error. Please contact support@kinvey.com for assistance.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
KinveyInternalErrorStop.prototype = Object.create(BaseError.prototype);
KinveyInternalErrorStop.prototype.constructor = KinveyInternalErrorStop;
module.exports = KinveyInternalErrorStop;
