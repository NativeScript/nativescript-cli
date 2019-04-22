import { KinveyError } from './kinvey';

export class NoActiveUserError extends KinveyError {
  constructor(message = 'There is not an active user.', debug?: string) {
    super(message, debug);
    this.name = 'NoActiveUserError';
  }
}
