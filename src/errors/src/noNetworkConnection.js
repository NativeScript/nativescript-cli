import KinveyError from './kinvey';

function NoNetworkConnectionError(message = 'You do not have a network connection.', ...args) {
  return KinveyError.call(this, message, ...args);
}

NoNetworkConnectionError.prototype = Object.create(KinveyError.prototype);
NoNetworkConnectionError.prototype.constructor = NoNetworkConnectionError;

export default NoNetworkConnectionError;

