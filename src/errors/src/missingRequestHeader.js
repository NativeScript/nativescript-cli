import KinveyError from './kinvey';

function MissingRequestHeaderError(message = 'The request is missing a required header.', ...args) {
  return KinveyError.call(this, message, ...args);
}

MissingRequestHeaderError.prototype = Object.create(KinveyError.prototype);
MissingRequestHeaderError.prototype.constructor = MissingRequestHeaderError;

export default MissingRequestHeaderError;

