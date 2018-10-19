import { BaseError } from './base';

export function StaleRequestError(message, debug, code, kinveyRequestId) {
  this.name = 'StaleRequestError';
  this.message = message || 'The time window for this request has expired.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
StaleRequestError.prototype = Object.create(BaseError.prototype);
StaleRequestError.prototype.constructor = StaleRequestError;
