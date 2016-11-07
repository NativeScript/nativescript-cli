function InvalidIdentifierError(message = 'One of more identifier names in the request has an invalid format.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'InvalidIdentifierError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

InvalidIdentifierError.prototype = Object.create(Error.prototype);
InvalidIdentifierError.prototype.constructor = InvalidIdentifierError;

export default InvalidIdentifierError;

