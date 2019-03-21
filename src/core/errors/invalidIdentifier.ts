import BaseError from './base';

export default class InvalidIdentifierError extends BaseError {
  constructor(message = 'One of more identifier names in the request has an invalid format.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, InvalidIdentifierError);
    // }

    // Custom debugging information
    this.name = 'InvalidIdentifierError';
  }
}
