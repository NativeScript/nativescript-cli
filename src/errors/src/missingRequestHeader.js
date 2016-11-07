function MissingRequestHeaderError(message = 'The request is missing a required header.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'MissingRequestHeaderError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

MissingRequestHeaderError.prototype = Object.create(Error.prototype);
MissingRequestHeaderError.prototype.constructor = MissingRequestHeaderError;

export default MissingRequestHeaderError;

