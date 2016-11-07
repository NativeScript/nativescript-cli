function KinveyError(message = 'An error occurred.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'KinveyError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

KinveyError.prototype = Object.create(Error.prototype);
KinveyError.prototype.constructor = KinveyError;

export default KinveyError;
