import KinveyError from './kinvey';

export default class InvalidQuerySyntaxError extends KinveyError {
  constructor(message = 'The query string in the request has an invalid syntax.', debug, code) {
    super('InvalidQuerySyntaxError', message, debug, code);
  }
}
