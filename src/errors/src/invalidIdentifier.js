import KinveyError from './kinvey';

function InvalidIdentifierError(message = 'One of more identifier names in the request has an invalid format.', ..args) {
  return KinveyError.call(this, message, ...args);
}

InvalidIdentifierError.prototype = Object.create(KinveyError.prototype);
InvalidIdentifierError.prototype.constructor = InvalidIdentifierError;

export default InvalidIdentifierError;

