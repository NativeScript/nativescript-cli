import BaseError from './base';

export default class UserAlreadyExistsError extends BaseError {
  constructor(message = 'This username is already taken.'
    + ' Please retry your request with a different username.', debug, code, kinveyRequestId) {
    super('UserAlreadyExistsError', message, debug, code, kinveyRequestId);
  }
}
