import { KinveyError } from './kinvey';

export class QueryError extends KinveyError {
  constructor(message = 'An error occurred with the query.', debug) {
    super(message, debug);
    this.name = 'QueryError';
  }
}
