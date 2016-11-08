import KinveyError from './kinvey';

function NotFoundError(message = 'The item was not found.', debug, code = 404) {
  return KinveyError.call(this, message, debug, code);
}

NotFoundError.prototype = Object.create(KinveyError.prototype);
NotFoundError.prototype.constructor = NotFoundError;

export default NotFoundError;

