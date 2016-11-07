function JSONParseError(message = 'Unable to parse the JSON in the request.', debug = '', code = -1) {
  const error = Error.call(this, message);

  this.name = 'JSONParseError';
  this.message = error.message;
  this.stack = error.stack;
  this.debug = debug;
  this.code = code;
}

JSONParseError.prototype = Object.create(Error.prototype);
JSONParseError.prototype.constructor = JSONParseError;

export default JSONParseError;

