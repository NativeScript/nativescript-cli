import { KinveyError } from './kinvey';

export class MobileIdentityConnectError extends KinveyError {
  constructor(message = 'An error has occurred with Mobile Identity Connect.') {
    super(message);
    this.name = 'MobileIdentityConnectError';
  }
}
