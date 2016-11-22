import KinveyError from './kinvey';

export default class MissingQueryError extends KinveyError {
  constructor(message = 'The request is missing a query string.', debug, code) {
    super('MissingQueryError', message, debug, code);
  }
}
