import KinveyError from './kinvey';

function QueryError(message = 'An error occurred on the query.', ...args) {
  return KinveyError.call(this, message, ...args);
}

QueryError.prototype = Object.create(KinveyError.prototype);
QueryError.prototype.constructor = QueryError;

export default QueryError;
