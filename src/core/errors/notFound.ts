import BaseError from './base';

export default class NotFoundError extends BaseError {
  constructor(message = 'The entity was not found.', debug?, code = 404, ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, debug, code, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, NotFoundError);
    // }

    // Custom debugging information
    this.name = 'NotFoundError';
  }
}
