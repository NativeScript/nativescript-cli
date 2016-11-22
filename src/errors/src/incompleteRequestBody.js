import KinveyError from './kinvey';

export default class IncompleteRequestBodyError extends KinveyError {
  constructor(message = 'The request body is either missing or incomplete.', debug, code) {
    super('IncompleteRequestBodyError', message, debug, code);
  }
}
