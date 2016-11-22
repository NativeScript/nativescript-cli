import KinveyError from './kinvey';

export default class ServerError extends KinveyError {
  constructor(message = 'An error occurred on the server.', debug, code = 500) {
    super('ServerError', message, debug, code);
  }
}
