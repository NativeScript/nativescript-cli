import BaseError from './base';

export default class UserAlreadyExistsError extends BaseError {
  constructor(message = 'This username is already taken. Please retry your request with a different username.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserAlreadyExistsError);
    }

    // Custom debugging information
    this.name = 'UserAlreadyExistsError';
  }
}
