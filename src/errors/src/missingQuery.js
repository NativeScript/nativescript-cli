import BaseError from './base';

export default class MissingQueryError extends BaseError {
  constructor(message = 'The request is missing a query string.', debug, code, kinveyRequestId) {
    super('MissingQueryError', message, debug, code, kinveyRequestId);
  }
}
