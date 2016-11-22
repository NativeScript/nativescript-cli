import KinveyError from './kinvey';

export default class InvalidCredentialsError extends KinveyError {
  constructor(message = 'Invalid credentials. Please retry your request with correct credentials.', debug, code) {
    super('InvalidCredentialsError', message, debug, code);
  }
}

