import { KinveyError } from './kinvey';

export class AppProblemError extends KinveyError {
  constructor(message = 'There is a problem with this app backend that prevents execution of this operation. Please contact support@kinvey.com for assistance.', debug) {
    super(message, debug);
    this.name = 'AppProblemError';
  }
}
