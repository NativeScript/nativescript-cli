import { BaseError } from './base';

export function InvalidCachedQuery(message, debug, code, kinveyRequestId) {
  this.name = 'InvalidCachedQuery';
  this.message = message || 'Invalid cached query.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
InvalidCachedQuery.prototype = Object.create(BaseError.prototype);
InvalidCachedQuery.prototype.constructor = InvalidCachedQuery;
