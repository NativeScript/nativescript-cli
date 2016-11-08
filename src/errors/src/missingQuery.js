import KinveyError from './kinvey';

function MissingQueryError(message = 'The request is missing a query string.', ..args) {
  return KinveyError.call(this, message, ...args);
}

MissingQueryError.prototype = Object.create(KinveyError.prototype);
MissingQueryError.prototype.constructor = MissingQueryError;

export default MissingQueryError;

