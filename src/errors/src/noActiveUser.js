import KinveyError from './kinvey';

function NoActiveUserError(message = 'There is not an active user.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

NoActiveUserError.prototype = Object.create(KinveyError.prototype);
NoActiveUserError.prototype.constructor = NoActiveUserError;

export default NoActiveUserError;

