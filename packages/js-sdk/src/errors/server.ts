import { KinveyError } from './kinvey';

export class ServerError extends KinveyError {
  constructor(message = 'An error occurred on the server.') {
    super(message);
    this.name = 'ServerError';
  }
}
