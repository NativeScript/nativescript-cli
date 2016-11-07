function InvalidCredentialsError(message = 'Invalid credentials. Please retry your request with correct credentials.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'InvalidCredentialsError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

InvalidCredentialsError.prototype = Object.create(Error.prototype);
InvalidCredentialsError.prototype.constructor = InvalidCredentialsError;

export default InvalidCredentialsError;

