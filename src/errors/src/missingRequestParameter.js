import KinveyError from './kinvey';

export default class MissingRequestParameterError extends KinveyError {
  constructor(message = 'A required parameter is missing from the request.', debug, code) {
    super('MissingRequestParameterError', message, debug, code);
  }
}
