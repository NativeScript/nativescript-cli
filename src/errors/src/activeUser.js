import KinveyError from './kinvey';

function ActiveUserError(message = 'An active user already exists.', ...args) {
  return KinveyError.call(this, message, ...args);
}

ActiveUserError.prototype = Object.create(KinveyError.prototype);
ActiveUserError.prototype.constructor = ActiveUserError;

export default ActiveUserError;
