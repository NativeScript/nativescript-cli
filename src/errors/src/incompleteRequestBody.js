import BaseError from './base';

export default class IncompleteRequestBodyError extends BaseError {
  constructor(message = 'The request body is either missing or incomplete.', debug, code, kinveyRequestId) {
    super('IncompleteRequestBodyError', message, debug, code, kinveyRequestId);
  }
}
