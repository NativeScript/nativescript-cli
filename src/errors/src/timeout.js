import BaseError from './base';

export default class TimeoutError extends BaseError {
  constructor(message = 'The request timed out.', debug, code) {
    super('TimeoutError', message, debug, code);
  }
}
