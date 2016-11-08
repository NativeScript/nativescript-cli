import KinveyError from './kinvey';

function FeatureUnavailableError(message = 'Requested functionality is unavailable in this API version.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

FeatureUnavailableError.prototype = Object.create(KinveyError.prototype);
FeatureUnavailableError.prototype.constructor = FeatureUnavailableError;

export default FeatureUnavailableError;
