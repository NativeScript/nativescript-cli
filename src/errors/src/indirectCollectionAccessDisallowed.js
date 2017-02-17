import BaseError from './base';

export default class IndirectCollectionAccessDisallowedError extends BaseError {
  constructor(message = 'Please use the appropriate API to access this'
    + ' collection for this app backend.', debug, code, kinveyRequestId) {
    super('IndirectCollectionAccessDisallowedError', message, debug, code, kinveyRequestId);
  }
}
