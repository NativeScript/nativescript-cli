function MissingQueryError(message = 'The request is missing a query string.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'MissingQueryError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

MissingQueryError.prototype = Object.create(Error.prototype);
MissingQueryError.prototype.constructor = MissingQueryError;

export default MissingQueryError;

