import { KinveyError } from './kinvey';

export class IncompleteRequestBodyError extends KinveyError {
  constructor(message = 'The request body is either missing or incomplete.') {
    super(message);
    this.name = 'IncompleteRequestBodyError';
  }
}
