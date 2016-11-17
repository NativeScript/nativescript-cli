import KinveyError from './kinvey';

function IncompleteRequestBodyError(message = 'The request body is either missing or incomplete.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

IncompleteRequestBodyError.prototype = Object.create(KinveyError.prototype);
IncompleteRequestBodyError.prototype.constructor = IncompleteRequestBodyError;

export default IncompleteRequestBodyError;
