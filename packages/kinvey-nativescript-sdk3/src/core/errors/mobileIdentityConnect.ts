import BaseError from './base';

export default class MobileIdentityConnectError extends BaseError {
  constructor(message = 'An error has occurred with Mobile Identity Connect.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, MobileIdentityConnectError);
    // }

    // Custom debugging information
    this.name = 'MobileIdentityConnectError';
  }
}
