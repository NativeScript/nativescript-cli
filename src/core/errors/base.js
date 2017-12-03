export function BaseError(message, debug, code, kinveyRequestId) {
  this.name = 'BaseError';
  this.message = message || 'An error occurred.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
BaseError.prototype = Object.create(Error.prototype);
BaseError.prototype.constructor = BaseError;
