import { KinveyError } from './kinvey';

export class KinveyInternalErrorRetry extends KinveyError {
  constructor(message = 'The Kinvey server encountered an unexpected error. Please retry your request.', debug?: string) {
    super(message, debug);
    this.name = 'KinveyInternalErrorRetry';
  }
}
