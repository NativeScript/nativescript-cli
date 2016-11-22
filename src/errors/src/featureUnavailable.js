import KinveyError from './kinvey';

export default class FeatureUnavailableError extends KinveyError {
  constructor(message = 'Requested functionality is unavailable in this API version.', debug, code) {
    super('FeatureUnavailableError', message, debug, code);
  }
}
