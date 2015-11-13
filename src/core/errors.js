const isFunction = require('lodash/lang/isFunction');

class KinveyError extends Error {
  constructor(message = 'An error occurred.', debug = '') {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.debug = debug;

    if (isFunction(Error.captureStackTrace)) {
      Error.captureStackTrace(this, this.constructor.name);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

class ActiveUserError extends KinveyError {
  constructor(message = 'An active user already exists.', debug) {
    super(message, debug);
  }
}

class NotFoundError extends KinveyError {
  constructor(message = 'The item was not found.', debug) {
    super(message, debug);
  }
}

module.exports = {
  KinveyError: KinveyError,
  ActiveUserError: ActiveUserError,
  NotFoundError: NotFoundError
};
