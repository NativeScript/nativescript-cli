const BaseError = require('./base');

function NetworkConnectionError(message, debug, code, kinveyRequestId) {
  this.name = 'NetworkConnectionError';
  this.message = message || 'There was an error connecting to the network.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
NetworkConnectionError.prototype = Object.create(BaseError.prototype);
NetworkConnectionError.prototype.constructor = NetworkConnectionError;
module.exports = NetworkConnectionError;
