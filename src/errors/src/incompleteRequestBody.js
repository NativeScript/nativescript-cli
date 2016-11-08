import KinveyError from './kinvey';

function IncompleteRequestBodyError(message = 'The request body is either missing or incomplete.', ...args) {
  return KinveyError.call(this, message, ...args);
}

IncompleteRequestBodyError.prototype = Object.create(KinveyError.prototype);
IncompleteRequestBodyError.prototype.constructor = IncompleteRequestBodyError;

export default IncompleteRequestBodyError;
