import BaseError from './base';

export default class SyncError extends BaseError {
  constructor(message = 'An error occurred during sync.', debug, code) {
    super('SyncError', message, debug, code);
  }
}
