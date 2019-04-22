import { KinveyError } from './kinvey';

export class StaleRequestError extends KinveyError {
  constructor(message = 'The time window for this request has expired.', debug?: string) {
    super(message, debug);
    this.name = 'StaleRequestError';
  }
}
