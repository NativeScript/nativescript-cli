import BaseError from './base';

export default class ParameterValueOutOfRangeError extends BaseError {
  constructor(message = 'The value specified for one of the request parameters is out of range.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, ParameterValueOutOfRangeError);
    // }

    // Custom debugging information
    this.name = 'ParameterValueOutOfRangeError';
  }
}
