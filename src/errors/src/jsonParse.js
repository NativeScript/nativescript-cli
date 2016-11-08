import KinveyError from './kinvey';

function JSONParseError(message = 'Unable to parse the JSON in the request.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

JSONParseError.prototype = Object.create(KinveyError.prototype);
JSONParseError.prototype.constructor = JSONParseError;

export default JSONParseError;

