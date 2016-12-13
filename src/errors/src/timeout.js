import KinveyError from './kinvey';

export default class TimeoutError extends KinveyError {
  constructor(message = 'The request timed out.', debug, code) {
    super('TimeoutError', message, debug, code);
  }
}
