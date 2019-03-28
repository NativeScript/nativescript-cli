import { KinveyError } from './kinvey';

export class NetworkConnectionError extends KinveyError {
  constructor(message = 'There was an error connecting to the network.') {
    super(message);
    this.name = 'NetworkConnectionError';
  }
}
