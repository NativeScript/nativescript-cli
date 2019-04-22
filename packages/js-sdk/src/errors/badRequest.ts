import { KinveyError } from './kinvey';

export class BadRequestError extends KinveyError {
  constructor(message = 'Unable to understand request.', debug?: string) {
    super(message, debug);
    this.name = 'BadRequestError';
  }
}
