import { KinveyError } from './kinvey';

export class BLError extends KinveyError {
  constructor(message = 'The Business Logic script did not complete.', debug) {
    super(message, debug);
    this.name = 'BLError';
  }
}
