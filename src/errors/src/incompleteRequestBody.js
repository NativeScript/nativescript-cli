function IncompleteRequestBodyError(message = 'The request body is either missing or incomplete.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'IncompleteRequestBodyError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

IncompleteRequestBodyError.prototype = Object.create(Error.prototype);
IncompleteRequestBodyError.prototype.constructor = IncompleteRequestBodyError;

export default IncompleteRequestBodyError;
