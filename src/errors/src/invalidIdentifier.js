import KinveyError from './kinvey';

function InvalidIdentifierError(message = 'One of more identifier names in the request has an invalid format.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

InvalidIdentifierError.prototype = Object.create(KinveyError.prototype);
InvalidIdentifierError.prototype.constructor = InvalidIdentifierError;

export default InvalidIdentifierError;

