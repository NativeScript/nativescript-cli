import BaseError from './base';

export default class DuplicateEndUsersError extends BaseError {
  constructor(message = 'More than one user registered with this username for this application.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DuplicateEndUsersError);
    }

    // Custom debugging information
    this.name = 'DuplicateEndUsersError';
  }
}
