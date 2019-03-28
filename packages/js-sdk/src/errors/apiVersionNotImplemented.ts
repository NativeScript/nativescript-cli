import { KinveyError } from './kinvey';

export class APIVersionNotImplementedError extends KinveyError {
  constructor(message = 'This API version is not implemented.') {
    super(message);
    this.name = 'APIVersionNotImplementedError';
  }
}
