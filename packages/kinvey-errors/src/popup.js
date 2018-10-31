import BaseError from './base';

export default class PopupError extends BaseError {
  constructor(message = 'Unable to open a popup on this platform.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PopupError);
    }

    // Custom debugging information
    this.name = 'PopupError';
  }
}
