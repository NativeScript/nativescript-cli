function NotFoundError(message = 'The item was not found.', debug = '', code = 404) {
  const error = Error.call(this, message);

  this.name = 'NotFoundError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;

export default NotFoundError;

