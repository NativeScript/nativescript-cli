function MissingRequestParameterError(message = 'A required parameter is missing from the request.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'MissingRequestParameterError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

MissingRequestParameterError.prototype = Object.create(Error.prototype);
MissingRequestParameterError.prototype.constructor = MissingRequestParameterError;

export default MissingRequestParameterError;

