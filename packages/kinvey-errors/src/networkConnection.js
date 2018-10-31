import BaseError from './base';

export default class NetworkConnectionError extends BaseError {
  constructor(message = 'There was an error connecting to the network.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkConnectionError);
    }

    // Custom debugging information
    this.name = 'NetworkConnectionError';
  }
}
