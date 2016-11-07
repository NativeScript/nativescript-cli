function ActiveUserError(message = 'An active user already exists.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'ActiveUserError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

ActiveUserError.prototype = Object.create(Error.prototype);
ActiveUserError.prototype.constructor = ActiveUserError;

export default ActiveUserError;
