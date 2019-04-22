import { KinveyError } from './kinvey';

export class ResultSetSizeExceededError extends KinveyError {
  constructor(message = 'Result set size exceeded.', debug) {
    super(message, debug);
    this.name = 'ResultSetSizeExceededError';
  }
}
