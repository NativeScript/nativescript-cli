import { KinveyError } from './kinvey';

export class MissingRequestParameterError extends KinveyError {
  constructor(message = 'A required parameter is missing from the request.') {
    super(message);
    this.name = 'MissingRequestParameterError';
  }
}
