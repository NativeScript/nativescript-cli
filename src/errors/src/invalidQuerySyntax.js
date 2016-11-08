import KinveyError from './kinvey';

function InvalidQuerySyntaxError(message = 'The query string in the request has an invalid syntax.', ...args) {
  return KinveyError.call(this, message, ...args);
}

InvalidQuerySyntaxError.prototype = Object.create(KinveyError.prototype);
InvalidQuerySyntaxError.prototype.constructor = InvalidQuerySyntaxError;

export default InvalidQuerySyntaxError;

