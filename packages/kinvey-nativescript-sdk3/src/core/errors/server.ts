import BaseError from './base';

export default class ServerError extends BaseError {
  constructor(message = 'An error occurred on the server.', debug?, code = 500, ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, debug, code, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, ServerError);
    // }

    // Custom debugging information
    this.name = 'ServerError';
  }
}
