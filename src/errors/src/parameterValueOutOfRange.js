function ParameterValueOutOfRangeError(message = 'The value specified for one of the request parameters is out of range.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'ParameterValueOutOfRangeError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

ParameterValueOutOfRangeError.prototype = Object.create(Error.prototype);
ParameterValueOutOfRangeError.prototype.constructor = ParameterValueOutOfRangeError;

export default ParameterValueOutOfRangeError;

