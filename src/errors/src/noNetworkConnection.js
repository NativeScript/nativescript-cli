import KinveyError from './kinvey';

function NoNetworkConnectionError(message = 'You do not have a network connection.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

NoNetworkConnectionError.prototype = Object.create(KinveyError.prototype);
NoNetworkConnectionError.prototype.constructor = NoNetworkConnectionError;

export default NoNetworkConnectionError;

