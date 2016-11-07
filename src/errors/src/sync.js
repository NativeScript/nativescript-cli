function SyncError(message = 'An error occurred during sync.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'SyncError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

SyncError.prototype = Object.create(Error.prototype);
SyncError.prototype.constructor = SyncError;

export default SyncError;
