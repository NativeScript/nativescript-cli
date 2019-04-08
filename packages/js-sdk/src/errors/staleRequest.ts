import { KinveyError } from './kinvey';

export class StaleRequestError extends KinveyError {
  constructor(message = 'The time window for this request has expired.') {
    super(message);
    this.name = 'StaleRequestError';
  }
}
