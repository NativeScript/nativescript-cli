import BaseError from './base';

export default class MissingRequestParameterError extends BaseError {
  constructor(message = 'A required parameter is missing from the request.', debug, code) {
    super('MissingRequestParameterError', message, debug, code);
  }
}
