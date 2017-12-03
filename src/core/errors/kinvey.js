import { BaseError } from './base';

export function KinveyError(message, debug, code, kinveyRequestId) {
  this.name = 'KinveyError';
  this.message = message || 'An error occurred.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
KinveyError.prototype = Object.create(BaseError.prototype);
KinveyError.prototype.constructor = KinveyError;
