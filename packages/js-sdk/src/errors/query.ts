import { KinveyError } from './kinvey';

export class QueryError extends KinveyError {
  constructor(message = 'An error occurred with the query.', debug?: string) {
    super(message, debug);
    this.name = 'QueryError';
  }
}
