import BaseError from './base';

export default class NetworkConnectionError extends BaseError {
  constructor(message = 'There was an error connecting to the network.', debug, code, kinveyRequestId) {
    super('NetworkConnectionError', message, debug, code, kinveyRequestId);
  }
}
