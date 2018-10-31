import BaseError from './base';

export default class KinveyError extends BaseError {
  constructor(message = 'An error occurred.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KinveyError);
    }

    // Custom debugging information
    this.name = 'KinveyError';
  }
}
