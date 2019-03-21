import BaseError from './base';

export default class KinveyInternalErrorStop extends BaseError {
  constructor(message = 'The Kinvey server encountered an unexpected error. Please contact support@kinvey.com for assistance.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, KinveyInternalErrorStop);
    // }

    // Custom debugging information
    this.name = 'KinveyInternalErrorStop';
  }
}
