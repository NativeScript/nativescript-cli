import BaseError from './base';

function NotFoundError(message, debug, code, kinveyRequestId) {
  this.name = 'NotFoundError';
  this.message = message || 'The entity was not found.';
  this.debug = debug || undefined;
  this.code = code || 404;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
NotFoundError.prototype = Object.create(BaseError.prototype);
NotFoundError.prototype.constructor = NotFoundError;
export default NotFoundError;