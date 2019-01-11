import BaseError from './base';

export default class MissingQueryError extends BaseError {
  constructor(message = 'The request is missing a query string.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingQueryError);
    }

    // Custom debugging information
    this.name = 'MissingQueryError';
  }
}
