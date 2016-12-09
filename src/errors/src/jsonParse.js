import BaseError from './base';

export default class JSONParseError extends BaseError {
  constructor(message = 'Unable to parse the JSON in the request.', debug, code) {
    super('JSONParseError', message, debug, code);
  }
}
