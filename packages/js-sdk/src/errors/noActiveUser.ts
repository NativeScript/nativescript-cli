import { KinveyError } from './kinvey';

export class NoActiveUserError extends KinveyError {
  constructor(message = 'There is not an active user.') {
    super(message);
    this.name = 'NoActiveUserError';
  }
}
