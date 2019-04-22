import { KinveyError } from './kinvey';

export class CORSDisabledError extends KinveyError {
  constructor(message = 'Cross Origin Support is disabled for this application.', debug?: string) {
    super(message, debug);
    this.name = 'CORSDisabledError';
  }
}
