import { KinveyError } from './kinvey';

export class InvalidQuerySyntaxError extends KinveyError {
  constructor(message = 'The query string in the request has an invalid syntax.', debug) {
    super(message, debug);
    this.name = 'InvalidQuerySyntaxError';
  }
}
