import { KinveyError } from './kinvey';

export class APIVersionNotAvailableError extends KinveyError {
  constructor(message = 'This API version is not available for your app.') {
    super(message);
    this.name = 'APIVersionNotAvailableError';
  }
}
