import { KinveyError } from './kinvey';

export class KinveyInternalErrorRetry extends KinveyError {
  constructor(message = 'The Kinvey server encountered an unexpected error. Please retry your request.', debug) {
    super(message, debug);
    this.name = 'KinveyInternalErrorRetry';
  }
}
