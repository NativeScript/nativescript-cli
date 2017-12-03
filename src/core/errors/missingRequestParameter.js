import { BaseError } from './base';

export function MissingRequestParameterError(message, debug, code, kinveyRequestId) {
  this.name = 'MissingRequestParameterError';
  this.message = message || 'A required parameter is missing from the request.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
MissingRequestParameterError.prototype = Object.create(BaseError.prototype);
MissingRequestParameterError.prototype.constructor = MissingRequestParameterError;
