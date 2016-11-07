function ServerError(message = 'An error occurred on the server.', debug = '', code = 500) {
  const error = Error.call(this, message);

  this.name = 'ServerError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

ServerError.prototype = Object.create(Error.prototype);
ServerError.prototype.constructor = ServerError;

export default ServerError;
