import { BaseError } from './base';

export function InvalidCredentialsError(message, debug, code, kinveyRequestId) {
  this.name = 'InvalidCredentialsError';
  this.message = message || 'Invalid credentials. Please retry your request with correct credentials.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
InvalidCredentialsError.prototype = Object.create(BaseError.prototype);
InvalidCredentialsError.prototype.constructor = InvalidCredentialsError;
