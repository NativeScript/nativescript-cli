import KinveyError from './kinvey';

export default class NoNetworkConnectionError extends KinveyError {
  constructor(message = 'You do not have a network connection.', debug, code) {
    super('NoNetworkConnectionError', message, debug, code);
  }
}
