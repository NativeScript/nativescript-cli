import { KinveyError } from './kinvey';

export class MissingRequestHeaderError extends KinveyError {
  constructor(message = 'The request is missing a required header.', debug) {
    super(message, debug);
    this.name = 'MissingRequestHeaderError';
  }
}
