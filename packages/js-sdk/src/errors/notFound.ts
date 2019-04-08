import { KinveyError } from './kinvey';

export class NotFoundError extends KinveyError {
  constructor(message = 'The entity was not found.') {
    super(message);
    this.name = 'NotFoundError';
  }
}
