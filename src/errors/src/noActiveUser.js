function NoActiveUserError(message = 'There is not an active user.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'NoActiveUserError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

NoActiveUserError.prototype = Object.create(Error.prototype);
NoActiveUserError.prototype.constructor = NoActiveUserError;

export default NoActiveUserError;

