import KinveyError from './kinvey';

function ActiveUserError(message = 'An active user already exists.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

ActiveUserError.prototype = Object.create(KinveyError.prototype);
ActiveUserError.prototype.constructor = ActiveUserError;

export default ActiveUserError;
