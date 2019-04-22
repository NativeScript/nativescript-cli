import { KinveyError } from './kinvey';

export class IncompleteRequestBodyError extends KinveyError {
  constructor(message = 'The request body is either missing or incomplete.', debug) {
    super(message, debug);
    this.name = 'IncompleteRequestBodyError';
  }
}
