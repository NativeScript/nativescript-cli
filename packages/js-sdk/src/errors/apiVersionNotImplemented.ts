import { KinveyError } from './kinvey';

export class APIVersionNotImplementedError extends KinveyError {
  constructor(message = 'This API version is not implemented.', debug?: string) {
    super(message, debug);
    this.name = 'APIVersionNotImplementedError';
  }
}
