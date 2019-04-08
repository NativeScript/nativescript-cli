import { KinveyError } from './kinvey';

export class KinveyInternalErrorStop extends KinveyError {
  constructor(message = 'The Kinvey server encountered an unexpected error. Please contact support@kinvey.com for assistance.') {
    super(message);
    this.name = 'KinveyInternalErrorStop';
  }
}
