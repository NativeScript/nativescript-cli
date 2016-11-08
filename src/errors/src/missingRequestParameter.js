import KinveyError from './kinvey';

function MissingRequestParameterError(message = 'A required parameter is missing from the request.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

MissingRequestParameterError.prototype = Object.create(KinveyError.prototype);
MissingRequestParameterError.prototype.constructor = MissingRequestParameterError;

export default MissingRequestParameterError;

