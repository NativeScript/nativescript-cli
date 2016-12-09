import BaseError from './base';

export default class ActiveUserError extends BaseError {
  constructor(message = 'An active user already exists.', debug, code) {
    super('ActiveUserError', message, debug, code);
  }
}
