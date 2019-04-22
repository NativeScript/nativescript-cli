import { KinveyError } from './kinvey';

export class ParameterValueOutOfRangeError extends KinveyError {
  constructor(message = 'The value specified for one of the request parameters is out of range.', debug?: string) {
    super(message, debug);
    this.name = 'ParameterValueOutOfRangeError';
  }
}
