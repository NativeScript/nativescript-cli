import KinveyError from './kinvey';

function QueryError(message = 'An error occurred on the query.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

QueryError.prototype = Object.create(KinveyError.prototype);
QueryError.prototype.constructor = QueryError;

export default QueryError;
