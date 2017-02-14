import BaseError from './base';

export default class CORSDisabledError extends BaseError {
  constructor(message = 'Cross Origin Support is disabled for this application.', debug, code, kinveyRequestId) {
    super('CORSDisabledError', message, debug, code, kinveyRequestId);
  }
}
