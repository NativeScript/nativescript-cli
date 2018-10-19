import { BaseError } from './base';

export function ResultSetSizeExceededError(message, debug, code, kinveyRequestId) {
  this.name = 'ResultSetSizeExceededError';
  this.message = message || 'Result set size exceeded.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
ResultSetSizeExceededError.prototype = Object.create(BaseError.prototype);
ResultSetSizeExceededError.prototype.constructor = ResultSetSizeExceededError;
