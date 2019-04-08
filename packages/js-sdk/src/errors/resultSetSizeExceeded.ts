import { KinveyError } from './kinvey';

export class ResultSetSizeExceededError extends KinveyError {
  constructor(message = 'Result set size exceeded.') {
    super(message);
    this.name = 'ResultSetSizeExceededError';
  }
}
