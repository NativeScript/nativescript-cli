import { BaseError } from './base';

export function TimeoutError(message, debug, code, kinveyRequestId) {
  this.name = 'TimeoutError';
  this.message = message || 'The request timed out.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
TimeoutError.prototype = Object.create(BaseError.prototype);
TimeoutError.prototype.constructor = TimeoutError;
