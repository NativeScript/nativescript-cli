import BaseError from './base';

export default class InvalidQuerySyntaxError extends BaseError {
  constructor(message = 'The query string in the request has an invalid syntax.', debug, code) {
    super('InvalidQuerySyntaxError', message, debug, code);
  }
}
