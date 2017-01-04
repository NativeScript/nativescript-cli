import BaseError from './base';

export default class NoActiveUserError extends BaseError {
  constructor(message = 'There is not an active user.', debug, code, kinveyRequestId) {
    super('NoActiveUserError', message, debug, code, kinveyRequestId);
  }
}
