import BaseError from './base';

export default class IncompleteRequestBodyError extends BaseError {
  constructor(message = 'The request body is either missing or incomplete.', debug, code) {
    super('IncompleteRequestBodyError', message, debug, code);
  }
}
