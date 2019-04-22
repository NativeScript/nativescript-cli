import { KinveyError } from './kinvey';

export class MissingConfigurationError extends KinveyError {
  constructor(message = 'Missing configuration error.', debug?: string) {
    super(message, debug);
    this.name = 'MissingConfigurationError';
  }
}
