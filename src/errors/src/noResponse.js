function NoResponseError(message = 'No response was provided.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'NoResponseError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

NoResponseError.prototype = Object.create(Error.prototype);
NoResponseError.prototype.constructor = NoResponseError;

export default NoResponseError;

