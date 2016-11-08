import KinveyError from './kinvey';

function NoResponseError(message = 'No response was provided.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

NoResponseError.prototype = Object.create(KinveyError.prototype);
NoResponseError.prototype.constructor = NoResponseError;

export default NoResponseError;

