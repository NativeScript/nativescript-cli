import BaseError from './base';

export default class JSONParseError extends BaseError {
  constructor(message = 'Unable to parse the JSON in the request.', debug, code, kinveyRequestId) {
    super('JSONParseError', message, debug, code, kinveyRequestId);
  }
}
