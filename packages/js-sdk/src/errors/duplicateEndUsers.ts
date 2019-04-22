import { KinveyError } from './kinvey';

export class DuplicateEndUsersError extends KinveyError {
  constructor(message = 'More than one user registered with this username for this application.', debug?: string) {
    super(message, debug);
    this.name = 'DuplicateEndUsersError';
  }
}
