import { KinveyError } from './kinvey';

export class NoResponseError extends KinveyError {
  constructor(message = 'No response was provided.') {
    super(message);
    this.name = 'NoResponseError';
  }
}
