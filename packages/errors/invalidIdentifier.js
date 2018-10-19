import { BaseError } from './base';

export function InvalidIdentifierError(message, debug, code, kinveyRequestId) {
  this.name = 'InvalidIdentifierError';
  this.message = message || 'One of more identifier names in the request has an invalid format.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
InvalidIdentifierError.prototype = Object.create(BaseError.prototype);
InvalidIdentifierError.prototype.constructor = InvalidIdentifierError;
