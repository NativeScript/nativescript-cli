import KinveyError from './kinvey';

export default class NoActiveUserError extends KinveyError {
  constructor(message = 'There is not an active user.', debug, code) {
    super('NoActiveUserError', message, debug, code);
  }
}
