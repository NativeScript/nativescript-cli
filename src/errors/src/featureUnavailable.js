function FeatureUnavailableError(message = 'Requested functionality is unavailable in this API version.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'FeatureUnavailableError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

FeatureUnavailableError.prototype = Object.create(Error.prototype);
FeatureUnavailableError.prototype.constructor = FeatureUnavailableError;

export default FeatureUnavailableError;
