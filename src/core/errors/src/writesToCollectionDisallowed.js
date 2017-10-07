import BaseError from './base';

function WritesToCollectionDisallowedError(message, debug, code, kinveyRequestId) {
  this.name = 'WritesToCollectionDisallowedError';
  this.message = message || 'This collection is configured to disallow any modifications to an existing entity or creation of new entities.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
WritesToCollectionDisallowedError.prototype = Object.create(BaseError.prototype);
WritesToCollectionDisallowedError.prototype.constructor = WritesToCollectionDisallowedError;
export default WritesToCollectionDisallowedError;