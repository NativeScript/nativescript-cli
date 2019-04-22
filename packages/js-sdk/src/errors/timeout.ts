import { KinveyError } from './kinvey';

export class TimeoutError extends KinveyError {
  constructor(message = 'The request timed out.', debug) {
    super(message, debug);
    this.name = 'TimeoutError';
  }
}
