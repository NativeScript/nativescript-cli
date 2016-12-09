import BaseError from './base';

export default class QueryError extends BaseError {
  constructor(message = 'An error occurred with the query.', debug, code) {
    super('QueryError', message, debug, code);
  }
}
