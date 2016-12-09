import BaseError from './base';

export default class NoNetworkConnectionError extends BaseError {
  constructor(message = 'You do not have a network connection.', debug, code) {
    super('NoNetworkConnectionError', message, debug, code);
  }
}
