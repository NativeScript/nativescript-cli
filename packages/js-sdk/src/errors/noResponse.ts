import { KinveyError } from './kinvey';

export class NoResponseError extends KinveyError {
  constructor(message = 'No response was provided.', debug?: string) {
    super(message, debug);
    this.name = 'NoResponseError';
  }
}
