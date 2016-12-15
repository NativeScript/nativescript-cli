import BaseError from './base';

export default class FeatureUnavailableError extends BaseError {
  constructor(message = 'Requested functionality is unavailable in this API version.', debug, code, kinveyRequestId) {
    super('FeatureUnavailableError', message, debug, code, kinveyRequestId);
  }
}
