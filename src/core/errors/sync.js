import { BaseError } from './base';

export function SyncError(message, debug, code, kinveyRequestId) {
  this.name = 'SyncError';
  this.message = message || 'An error occurred during sync.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
SyncError.prototype = Object.create(BaseError.prototype);
SyncError.prototype.constructor = SyncError;
