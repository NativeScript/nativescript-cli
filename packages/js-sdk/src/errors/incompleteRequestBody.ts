import { KinveyError } from './kinvey';

export class IncompleteRequestBodyError extends KinveyError {
  constructor(message = 'The request body is either missing or incomplete.', debug?: string) {
    super(message, debug);
    this.name = 'IncompleteRequestBodyError';
  }
}
