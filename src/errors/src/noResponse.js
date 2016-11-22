import KinveyError from './kinvey';

export default class NoResponseError extends KinveyError {
  constructor(message = 'No response was provided.', debug, code) {
    super('NoResponseError', message, debug, code);
  }
}
