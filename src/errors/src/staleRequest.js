import BaseError from './base';

export default class StaleRequestError extends BaseError {
  constructor(message = 'The time window for this request has expired.', debug, code, kinveyRequestId) {
    super('StaleRequestError', message, debug, code, kinveyRequestId);
  }
}
