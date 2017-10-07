import BaseError from './base';

function MissingRequestHeaderError(message, debug, code, kinveyRequestId) {
  this.name = 'MissingRequestHeaderError';
  this.message = message || 'The request is missing a required header.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
MissingRequestHeaderError.prototype = Object.create(BaseError.prototype);
MissingRequestHeaderError.prototype.constructor = MissingRequestHeaderError;
export default MissingRequestHeaderError;