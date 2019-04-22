import { KinveyError } from './kinvey';

export class ActiveUserError extends KinveyError {
  constructor(message = 'An active user already exists.', debug?: string) {
    super(message, debug);
    this.name = 'ActiveUserError';
  }
}

