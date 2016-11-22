import KinveyError from './kinvey';

export default class MissingRequestHeaderError extends KinveyError {
  constructor(message = 'The request is missing a required header.', debug, code) {
    super('MissingRequestHeaderError', message, debug, code);
  }
}
