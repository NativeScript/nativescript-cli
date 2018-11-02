import BaseError from './base';

export default class SyncError extends BaseError {
  constructor(message = 'An error occurred during sync.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SyncError);
    }

    // Custom debugging information
    this.name = 'SyncError';
  }
}
