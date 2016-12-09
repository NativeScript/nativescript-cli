import BaseError from './base';

export default class InvalidCredentialsError extends BaseError {
  constructor(message = 'Invalid credentials. Please retry your request with correct credentials.', debug, code, kinveyRequestId) {
    super('InvalidCredentialsError', message, debug, code, kinveyRequestId);
  }
}

