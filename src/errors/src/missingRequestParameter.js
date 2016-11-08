import KinveyError from './kinvey';

function MissingRequestParameterError(message = 'A required parameter is missing from the request.', ...args) {
  return KinveyError.call(this, message, ...args);
}

MissingRequestParameterError.prototype = Object.create(KinveyError.prototype);
MissingRequestParameterError.prototype.constructor = MissingRequestParameterError;

export default MissingRequestParameterError;

