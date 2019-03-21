import BaseError from './base';

export default class InvalidQuerySyntaxError extends BaseError {
  constructor(message = 'The query string in the request has an invalid syntax.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, InvalidQuerySyntaxError);
    // }

    // Custom debugging information
    this.name = 'InvalidQuerySyntaxError';
  }
}
