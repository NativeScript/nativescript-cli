import { KinveyError } from './kinvey';

export class BadRequestError extends KinveyError {
  constructor(message = 'Unable to understand request.') {
    super(message);
    this.name = 'BadRequestError';
  }
}
