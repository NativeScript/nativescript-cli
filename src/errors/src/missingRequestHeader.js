import KinveyError from './kinvey';

function MissingRequestHeaderError(message = 'The request is missing a required header.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

MissingRequestHeaderError.prototype = Object.create(KinveyError.prototype);
MissingRequestHeaderError.prototype.constructor = MissingRequestHeaderError;

export default MissingRequestHeaderError;

