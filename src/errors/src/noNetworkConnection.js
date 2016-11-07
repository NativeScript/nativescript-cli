function NoNetworkConnectionError(message = 'You do not have a network connection.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'NoNetworkConnectionError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

NoNetworkConnectionError.prototype = Object.create(Error.prototype);
NoNetworkConnectionError.prototype.constructor = NoNetworkConnectionError;

export default NoNetworkConnectionError;

