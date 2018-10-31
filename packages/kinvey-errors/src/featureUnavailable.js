import BaseError from './base';

export default class FeatureUnavailableError extends BaseError {
  constructor(message = 'Requested functionality is unavailable in this API version.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FeatureUnavailableError);
    }

    // Custom debugging information
    this.name = 'FeatureUnavailableError';
  }
}
