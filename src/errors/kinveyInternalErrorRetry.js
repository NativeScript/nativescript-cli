import BaseError from './base';

export default class KinveyInternalErrorRetry extends BaseError {
  constructor(message = 'The Kinvey server encountered an unexpected error. Please retry your request.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KinveyInternalErrorRetry);
    }

    // Custom debugging information
    this.name = 'KinveyInternalErrorRetry';
  }
}
