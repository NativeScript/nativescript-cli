function InvalidQuerySyntaxError(message = 'The query string in the request has an invalid syntax.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'InvalidQuerySyntaxError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

InvalidQuerySyntaxError.prototype = Object.create(Error.prototype);
InvalidQuerySyntaxError.prototype.constructor = InvalidQuerySyntaxError;

export default InvalidQuerySyntaxError;

