import BaseError from './base';

export default class WriteToCollectionDisallowedError extends BaseError {
  constructor(message = 'This collection is configured to disallow any modifications to an existing entity or creation of new entities.', debug, code, kinveyRequestId) {
    super('WriteToCollectionDisallowedError', message, debug, code, kinveyRequestId);
  }
}
