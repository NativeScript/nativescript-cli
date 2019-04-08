import { KinveyError } from './kinvey';

export class KinveyInternalErrorRetry extends KinveyError {
  constructor(message = 'The Kinvey server encountered an unexpected error. Please retry your request.') {
    super(message);
    this.name = 'KinveyInternalErrorRetry';
  }
}
