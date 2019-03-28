import { KinveyError } from './kinvey';

export class UserAlreadyExistsError extends KinveyError {
  constructor(message = 'This username is already taken. Please retry your request with a different username.') {
    super(message);
    this.name = 'UserAlreadyExistsError';
  }
}
