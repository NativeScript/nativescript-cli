import BaseError from './base';

export default class ActiveUserError extends BaseError {
  constructor(message = 'An active user already exists.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ActiveUserError);
    }

    // Custom debugging information
    this.name = 'ActiveUserError';
  }
}

