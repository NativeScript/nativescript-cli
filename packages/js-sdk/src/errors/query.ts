import { KinveyError } from './kinvey';

export class QueryError extends KinveyError {
  constructor(message = 'An error occurred with the query.') {
    super(message);
    this.name = 'QueryError';
  }
}
