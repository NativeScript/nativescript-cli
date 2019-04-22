import { KinveyError } from './kinvey';

export class InsufficientCredentialsError extends KinveyError {
  constructor(message = 'The credentials used to authenticate this request are not authorized to run this operation. Please retry your request with appropriate credentials.', debug?: string) {
    super(message, debug);
    this.name = 'InsufficientCredentialsError';
  }
}
