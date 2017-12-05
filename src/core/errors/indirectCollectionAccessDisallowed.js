import { BaseError } from './base';

export function IndirectCollectionAccessDisallowedError(message, debug, code, kinveyRequestId) {
  this.name = 'IndirectCollectionAccessDisallowedError';
  this.message = message || 'Please use the appropriate API to access this collection for this app backend.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
IndirectCollectionAccessDisallowedError.prototype = Object.create(BaseError.prototype);
IndirectCollectionAccessDisallowedError.prototype.constructor = IndirectCollectionAccessDisallowedError;
