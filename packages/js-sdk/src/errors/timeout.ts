import { KinveyError } from './kinvey';

export class TimeoutError extends KinveyError {
  constructor(message = 'The request timed out.') {
    super(message);
    this.name = 'TimeoutError';
  }
}
