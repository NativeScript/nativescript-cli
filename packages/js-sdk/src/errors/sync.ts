import { KinveyError } from './kinvey';

export class SyncError extends KinveyError {
  constructor(message = 'An error occurred during sync.', debug?: string) {
    super(message, debug);
    this.name = 'SyncError';
  }
}
