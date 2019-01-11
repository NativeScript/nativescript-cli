import BaseError from './base';

export default class QueryError extends BaseError {
  constructor(message = 'An error occurred with the query.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryError);
    }

    // Custom debugging information
    this.name = 'QueryError';
  }
}
