import { KinveyError } from './kinvey';

export class MissingQueryError extends KinveyError {
  constructor(message = 'The request is missing a query string.') {
    super(message);
    this.name = 'MissingQueryError';
  }
}
