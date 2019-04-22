import { KinveyError } from './kinvey';

export class ResultSetSizeExceededError extends KinveyError {
  constructor(message = 'Result set size exceeded.', debug?: string) {
    super(message, debug);
    this.name = 'ResultSetSizeExceededError';
  }
}
