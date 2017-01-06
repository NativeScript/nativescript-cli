import BaseError from './base';

export default class NoResponseError extends BaseError {
  constructor(message = 'No response was provided.', debug, code, kinveyRequestId) {
    super('NoResponseError', message, debug, code, kinveyRequestId);
  }
}
