import { KinveyError } from './kinvey';

export class FeatureUnavailableError extends KinveyError {
  constructor(message = 'Requested functionality is unavailable in this API version.', debug?: string) {
    super(message, debug);
    this.name = 'FeatureUnavailableError';
  }
}
