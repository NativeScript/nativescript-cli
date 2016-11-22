import KinveyError from './kinvey';

export default class ActiveUserError extends KinveyError {
  constructor(message = 'An active user already exists.', debug, code) {
    super('ActiveUserError', message, debug, code);
  }
}
