import BaseError from './base';

export default class NoResponseError extends BaseError {
  constructor(message = 'No response was provided.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoResponseError);
    }

    // Custom debugging information
    this.name = 'NoResponseError';
  }
}
