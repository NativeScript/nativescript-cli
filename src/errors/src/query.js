function QueryError(message = 'An error occurred on the query.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'QueryError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

QueryError.prototype = Object.create(Error.prototype);
QueryError.prototype.constructor = QueryError;

export default QueryError;
