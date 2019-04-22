import { KinveyError } from './kinvey';

export class NotFoundError extends KinveyError {
  constructor(message = 'The entity was not found.', debug?: string) {
    super(message, debug);
    this.name = 'NotFoundError';
  }
}
