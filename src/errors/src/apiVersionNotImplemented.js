import BaseError from './base';

export default class APIVersionNotImplementedError extends BaseError {
  constructor(message = 'This API version is not implemented.'
    + ' Please retry your request with a supported API version.', debug, code, kinveyRequestId) {
    super('APIVersionNotImplementedError', message, debug, code, kinveyRequestId);
  }
}
