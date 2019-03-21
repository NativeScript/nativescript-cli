import BaseError from './base';

export default class WritesToCollectionDisallowedError extends BaseError {
  constructor(message = 'This collection is configured to disallow any modifications to an existing entity or creation of new entities.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, WritesToCollectionDisallowedError);
    // }

    // Custom debugging information
    this.name = 'WritesToCollectionDisallowedError';
  }
}
