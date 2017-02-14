import BaseError from './base';

export default class BLError extends BaseError {
  constructor(message = 'The Business Logic script did not complete.'
    + ' See debug message for details.', debug, code, kinveyRequestId) {
    super('BLError', message, debug, code, kinveyRequestId);
  }
}
