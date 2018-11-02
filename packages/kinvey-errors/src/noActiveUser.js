import BaseError from './base';

export default class NoActiveUserError extends BaseError {
  constructor(message = 'There is not an active user.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoActiveUserError);
    }

    // Custom debugging information
    this.name = 'NoActiveUserError';
  }
}
