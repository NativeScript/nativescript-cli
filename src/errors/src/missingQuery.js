import BaseError from './base';

function MissingQueryError(message, debug, code, kinveyRequestId) {
  this.name = 'MissingQueryError';
  this.message = message || 'The request is missing a query string.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
MissingQueryError.prototype = Object.create(BaseError.prototype);
MissingQueryError.prototype.constructor = MissingQueryError;
export default MissingQueryError;