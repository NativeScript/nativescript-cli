import BaseError from './base';

function QueryError(message, debug, code, kinveyRequestId) {
  this.name = 'QueryError';
  this.message = message || 'An error occurred with the query.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
QueryError.prototype = Object.create(BaseError.prototype);
QueryError.prototype.constructor = QueryError;
export default QueryError;