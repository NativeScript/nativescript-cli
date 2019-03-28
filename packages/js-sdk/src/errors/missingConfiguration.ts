import { KinveyError } from './kinvey';

export class MissingConfigurationError extends KinveyError {
  constructor(message = 'Missing configuration error.') {
    super(message);
    this.name = 'MissingConfigurationError';
  }
}
