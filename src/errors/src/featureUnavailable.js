import KinveyError from './kinvey';

function FeatureUnavailableError(message = 'Requested functionality is unavailable in this API version.', ...args) {
  return KinveyError.call(this, message, ...args);
}

FeatureUnavailableError.prototype = Object.create(KinveyError.prototype);
FeatureUnavailableError.prototype.constructor = FeatureUnavailableError;

export default FeatureUnavailableError;
