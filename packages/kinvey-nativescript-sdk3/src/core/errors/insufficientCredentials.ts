import BaseError from './base';

export default class InsufficientCredentialsError extends BaseError {
  constructor(message = 'The credentials used to authenticate this request are not authorized to run this operation. Please retry your request with appropriate credentials.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, InsufficientCredentialsError);
    // }

    // Custom debugging information
    this.name = 'InsufficientCredentialsError';
  }
}
