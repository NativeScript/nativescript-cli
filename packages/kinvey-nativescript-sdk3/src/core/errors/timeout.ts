import BaseError from './base';

export default class TimeoutError extends BaseError {
  constructor(message = 'The request timed out.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, TimeoutError);
    // }

    // Custom debugging information
    this.name = 'TimeoutError';
  }
}
