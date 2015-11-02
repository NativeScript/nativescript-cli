class KinveyError extends Error {
  constructor(message = 'An error occurred.', debug = '') {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.debug = debug;
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
