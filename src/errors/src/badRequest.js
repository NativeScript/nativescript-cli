import BaseError from './base';

export default class BadRequestError extends BaseError {
  constructor(message = 'Unable to understand request.', debug, code, kinveyRequestId) {
    super('BadRequestError', message, debug, code, kinveyRequestId);
  }
}
