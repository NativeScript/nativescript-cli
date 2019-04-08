import { KinveyError } from './kinvey';

export class InvalidCredentialsError extends KinveyError {
  constructor(message = 'Invalid credentials. Please retry your request with correct credentials.') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}
