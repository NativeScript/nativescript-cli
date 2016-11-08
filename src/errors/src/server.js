import KinveyError from './kinvey';

function ServerError(message = 'An error occurred on the server.', debug, code = 500) {
  return KinveyError.call(this, message, debug, code);
}

ServerError.prototype = Object.create(KinveyError.prototype);
ServerError.prototype.constructor = ServerError;

export default ServerError;
