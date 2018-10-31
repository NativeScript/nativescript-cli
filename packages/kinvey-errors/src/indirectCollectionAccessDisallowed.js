import BaseError from './base';

export default class IndirectCollectionAccessDisallowedError extends BaseError {
  constructor(message = 'Please use the appropriate API to access this collection for this app backend.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IndirectCollectionAccessDisallowedError);
    }

    // Custom debugging information
    this.name = 'IndirectCollectionAccessDisallowedError';
  }
}
