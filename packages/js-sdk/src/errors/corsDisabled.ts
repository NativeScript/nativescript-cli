import { KinveyError } from './kinvey';

export class CORSDisabledError extends KinveyError {
  constructor(message = 'Cross Origin Support is disabled for this application.') {
    super(message);
    this.name = 'CORSDisabledError';
  }
}
