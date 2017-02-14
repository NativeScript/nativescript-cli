import BaseError from './base';

export default class APIVersionNotAvailableError extends BaseError {
  constructor(message = 'This API version is not available for your app.'
    + ' Please retry your request with a supported API version.', debug, code, kinveyRequestId) {
    super('APIVersionNotAvailableError', message, debug, code, kinveyRequestId);
  }
}
