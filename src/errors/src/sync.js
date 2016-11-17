import KinveyError from './kinvey';

function SyncError(message = 'An error occurred during sync.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

SyncError.prototype = Object.create(KinveyError.prototype);
SyncError.prototype.constructor = SyncError;

export default SyncError;
