import KinveyError from './kinvey';

function InvalidCredentialsError(message = 'Invalid credentials. Please retry your request with correct credentials.', ...args) {
  return KinveyError.call(this, message, ...args);
}

InvalidCredentialsError.prototype = Object.create(KinveyError.prototype);
InvalidCredentialsError.prototype.constructor = InvalidCredentialsError;

export default InvalidCredentialsError;

