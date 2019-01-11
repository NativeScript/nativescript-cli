import BaseError from './base';

export default class CORSDisabledError extends BaseError {
  constructor(message = 'Cross Origin Support is disabled for this application.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CORSDisabledError);
    }

    // Custom debugging information
    this.name = 'CORSDisabledError';
  }
}
