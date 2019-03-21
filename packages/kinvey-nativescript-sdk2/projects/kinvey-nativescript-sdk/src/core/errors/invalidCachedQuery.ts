import BaseError from './base';

export default class InvalidCachedQuery extends BaseError {
  constructor(message = 'Invalid cached query.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, InvalidCachedQuery);
    // }

    // Custom debugging information
    this.name = 'InvalidCachedQuery';
  }
}
