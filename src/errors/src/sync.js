import KinveyError from './kinvey';

function SyncError(message = 'An error occurred during sync.', ...args) {
  return KinveyError.call(this, message, ...args);
}

SyncError.prototype = Object.create(KinveyError.prototype);
SyncError.prototype.constructor = SyncError;

export default SyncError;
