import BaseError from './base';

export default class InvalidIdentifierError extends BaseError {
  constructor(message = 'One of more identifier names in the request has an invalid format.', debug, code, kinveyRequestId) {
    super('InvalidIdentifierError', message, debug, code, kinveyRequestId);
  }
}
