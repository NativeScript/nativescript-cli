import BaseError from './base';

function BadRequestError(message, debug, code, kinveyRequestId) {
  this.name = 'BadRequestError';
  this.message = message || 'Unable to understand request.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
BadRequestError.prototype = Object.create(BaseError.prototype);
BadRequestError.prototype.constructor = BadRequestError;
export default BadRequestError;