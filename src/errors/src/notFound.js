import KinveyError from './kinvey';

export default class NotFoundError extends KinveyError {
  constructor(message = 'The item was not found.', debug, code = 404) {
    super('NotFoundError', message, debug, code);
  }
}
