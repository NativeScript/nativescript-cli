import KinveyError from './kinvey';

function InvalidQuerySyntaxError(message = 'The query string in the request has an invalid syntax.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

InvalidQuerySyntaxError.prototype = Object.create(KinveyError.prototype);
InvalidQuerySyntaxError.prototype.constructor = InvalidQuerySyntaxError;

export default InvalidQuerySyntaxError;

