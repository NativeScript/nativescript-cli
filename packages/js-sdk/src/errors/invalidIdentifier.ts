import { KinveyError } from './kinvey';

export class InvalidIdentifierError extends KinveyError {
  constructor(message = 'One of more identifier names in the request has an invalid format.', debug?: string) {
    super(message, debug);
    this.name = 'InvalidIdentifierError';
  }
}
