import KinveyError from './kinvey';

function NoActiveUserError(message = 'There is not an active user.', ...args) {
  return KinveyError.call(this, message, ...args);
}

NoActiveUserError.prototype = Object.create(KinveyError.prototype);
NoActiveUserError.prototype.constructor = NoActiveUserError;

export default NoActiveUserError;

