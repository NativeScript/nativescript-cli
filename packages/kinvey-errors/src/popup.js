const BaseError = require('./base');

function PopupError(message, debug, code, kinveyRequestId) {
  this.name = 'PopupError';
  this.message = message || 'Unable to open a popup on this platform.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
PopupError.prototype = Object.create(BaseError.prototype);
PopupError.prototype.constructor = PopupError;
module.exports = PopupError;
