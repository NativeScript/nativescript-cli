import KinveyError from './kinvey';

function InvalidCredentialsError(message = 'Invalid credentials. Please retry your request with correct credentials.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

InvalidCredentialsError.prototype = Object.create(KinveyError.prototype);
InvalidCredentialsError.prototype.constructor = InvalidCredentialsError;

export default InvalidCredentialsError;

