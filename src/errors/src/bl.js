import BaseError from './base';

export default class BLInternalError extends BaseError {
  constructor(message = 'The Business Logic script did not complete. See debug message for details.', debug, code, kinveyRequestId) {
    super('BLInternalError', message, debug, code, kinveyRequestId);
  }
}
