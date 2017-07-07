import BaseError from './base';

function InvalidQuerySyntaxError(message, debug, code, kinveyRequestId) {
  this.name = 'InvalidQuerySyntaxError';
  this.message = message || 'The query string in the request has an invalid syntax.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
InvalidQuerySyntaxError.prototype = Object.create(BaseError.prototype);
InvalidQuerySyntaxError.prototype.constructor = InvalidQuerySyntaxError;
export default InvalidQuerySyntaxError;