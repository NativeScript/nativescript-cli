import BaseError from './base';

export default class BadRequestError extends BaseError {
  constructor(message = 'Unable to understand request.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BadRequestError);
    }

    // Custom debugging information
    this.name = 'BadRequestError';
  }
}
