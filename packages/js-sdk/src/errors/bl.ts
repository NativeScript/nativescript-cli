import { KinveyError } from './kinvey';

export class BLError extends KinveyError {
  constructor(message = 'The Business Logic script did not complete.') {
    super(message);
    this.name = 'BLError';
  }
}
