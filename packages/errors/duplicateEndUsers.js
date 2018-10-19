import { BaseError } from './base';

export function DuplicateEndUsersError(message, debug, code, kinveyRequestId) {
  this.name = 'DuplicateEndUsersError';
  this.message = message || 'More than one user registered with this username for this application.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
DuplicateEndUsersError.prototype = Object.create(BaseError.prototype);
DuplicateEndUsersError.prototype.constructor = DuplicateEndUsersError;
