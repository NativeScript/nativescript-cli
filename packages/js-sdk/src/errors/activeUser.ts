import { KinveyError } from './kinvey';

export class ActiveUserError extends KinveyError {
  constructor(message = 'An active user already exists.', debug) {
    super(message, debug);
    this.name = 'ActiveUserError';
  }
}

