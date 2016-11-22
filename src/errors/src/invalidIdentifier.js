import KinveyError from './kinvey';

export default class InvalidIdentifierError extends KinveyError {
  constructor(message = 'One of more identifier names in the request has an invalid format.', debug, code) {
    super('InvalidIdentifierError', message, debug, code);
  }
}
