import KinveyError from './kinvey';

export default class SyncError extends KinveyError {
  constructor(message = 'An error occurred during sync.', debug, code) {
    super('SyncError', message, debug, code);
  }
}
