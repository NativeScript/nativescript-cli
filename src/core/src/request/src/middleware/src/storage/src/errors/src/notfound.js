function NotFoundError(message = 'Not Found Error', code = 404) {
  const error = Error.call(this, message);

  this.name = 'NotFoundError';
  this.message = error.message;
  this.stack = error.stack;
  this.code = code;
}

NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;

export default NotFoundError;
