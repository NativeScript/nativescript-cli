import BaseError from './base';

export default class NoResponseError extends BaseError {
  constructor(message = 'No response was provided.', debug, code) {
    super('NoResponseError', message, debug, code);
  }
}
