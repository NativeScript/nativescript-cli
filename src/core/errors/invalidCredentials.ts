import BaseError from './base';

export default class InvalidCredentialsError extends BaseError {
  constructor(message = 'Invalid credentials. Please retry your request with correct credentials.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, InvalidCredentialsError);
    // }

    // Custom debugging information
    this.name = 'InvalidCredentialsError';
  }
}
