import { KinveyError } from './kinvey';

export class MissingQueryError extends KinveyError {
  constructor(message = 'The request is missing a query string.', debug?: string) {
    super(message, debug);
    this.name = 'MissingQueryError';
  }
}
