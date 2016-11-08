import KinveyError from './kinvey';

function NoResponseError(message = 'No response was provided.', ...args) {
  return KinveyError.call(this, message, ...args);
}

NoResponseError.prototype = Object.create(KinveyError.prototype);
NoResponseError.prototype.constructor = NoResponseError;

export default NoResponseError;

