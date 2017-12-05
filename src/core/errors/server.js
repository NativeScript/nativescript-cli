import { BaseError } from './base';

export function ServerError(message, debug, code, kinveyRequestId) {
  this.name = 'ServerError';
  this.message = message || 'An error occurred on the server.';
  this.debug = debug || undefined;
  this.code = code || 500;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
ServerError.prototype = Object.create(BaseError.prototype);
ServerError.prototype.constructor = ServerError;
