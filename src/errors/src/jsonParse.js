import KinveyError from './kinvey';

function JSONParseError(message = 'Unable to parse the JSON in the request.', ...args) {
  return KinveyError.call(this, message, ...args);
}

JSONParseError.prototype = Object.create(KinveyError.prototype);
JSONParseError.prototype.constructor = JSONParseError;

export default JSONParseError;

