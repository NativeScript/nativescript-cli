import BaseError from './base';

export default class IncompleteRequestBodyError extends BaseError {
  constructor(message = 'The request body is either missing or incomplete.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, IncompleteRequestBodyError);
    // }

    // Custom debugging information
    this.name = 'IncompleteRequestBodyError';
  }
}
