function InsufficientCredentialsError(message = 'The credentials used to authenticate this request are not authorized to run ' +
    'this operation. Please retry your request with appropriate credentials.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'InsufficientCredentialsError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

InsufficientCredentialsError.prototype = Object.create(Error.prototype);
InsufficientCredentialsError.prototype.constructor = InsufficientCredentialsError;

export default InsufficientCredentialsError;
