import KinveyError from './kinvey';

function MissingQueryError(message = 'The request is missing a query string.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

MissingQueryError.prototype = Object.create(KinveyError.prototype);
MissingQueryError.prototype.constructor = MissingQueryError;

export default MissingQueryError;

