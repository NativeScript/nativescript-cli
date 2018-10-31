import BaseError from './base';

export default class JSONParseError extends BaseError {
  constructor(message = 'Unable to parse the JSON in the request.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JSONParseError);
    }

    // Custom debugging information
    this.name = 'JSONParseError';
  }
}
