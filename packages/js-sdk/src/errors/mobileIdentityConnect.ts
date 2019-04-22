import { KinveyError } from './kinvey';

export class MobileIdentityConnectError extends KinveyError {
  constructor(message = 'An error has occurred with Mobile Identity Connect.', debug) {
    super(message, debug);
    this.name = 'MobileIdentityConnectError';
  }
}
