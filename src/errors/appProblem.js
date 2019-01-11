import BaseError from './base';

export default class AppProblemError extends BaseError {
  constructor(message = 'There is a problem with this app backend that prevents execution of this operation. Please contact support@kinvey.com for assistance.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppProblemError);
    }

    // Custom debugging information
    this.name = 'AppProblemError';
  }
}
