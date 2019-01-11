import BaseError from './base';

export default class MissingConfigurationError extends BaseError {
  constructor(message = 'Missing configuration error.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingConfigurationError);
    }

    // Custom debugging information
    this.name = 'MissingConfigurationError';
  }
}
