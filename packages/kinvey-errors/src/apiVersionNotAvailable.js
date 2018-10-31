import BaseError from './base';

export default class APIVersionNotAvailableError extends BaseError {
  constructor(message = 'This API version is not available for your app.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIVersionNotAvailableError);
    }

    // Custom debugging information
    this.name = 'APIVersionNotAvailableError';
  }
}
