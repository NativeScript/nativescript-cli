import BaseError from './base';

export default class NoNetworkConnectionError extends BaseError {
  constructor(message = 'You do not have a network connection.', debug, code, kinveyRequestId) {
    super('NoNetworkConnectionError', message, debug, code, kinveyRequestId);
  }
}
