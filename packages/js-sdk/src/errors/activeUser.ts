import { KinveyError } from './kinvey';

export class ActiveUserError extends KinveyError {
  constructor(message = 'An active user already exists.') {
    super(message);
    this.name = 'ActiveUserError';
  }
}

