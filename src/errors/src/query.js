import KinveyError from './kinvey';

export default class QueryError extends KinveyError {
  constructor(message = 'An error occurred with the query.', debug, code) {
    super('QueryError', message, debug, code);
  }
}
