import KinveyError from './kinvey';

function InsufficientCredentialsError(message = 'The credentials used to authenticate this' +
    ' request are not authorized to run' +
    ' this operation. Please retry your' +
    ' request with appropriate credentials.', ...args) {
  return KinveyError.call(this, message, ...args);
}

InsufficientCredentialsError.prototype = Object.create(KinveyError.prototype);
InsufficientCredentialsError.prototype.constructor = InsufficientCredentialsError;

export default InsufficientCredentialsError;
