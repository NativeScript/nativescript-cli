import BaseError from './base';

export default class MissingRequestHeaderError extends BaseError {
  constructor(message = 'The request is missing a required header.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, MissingRequestHeaderError);
    // }

    // Custom debugging information
    this.name = 'MissingRequestHeaderError';
  }
}
