import BaseError from './base';

export default class StaleRequestError extends BaseError {
  constructor(message = 'The time window for this request has expired.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StaleRequestError);
    }

    // Custom debugging information
    this.name = 'StaleRequestError';
  }
}
