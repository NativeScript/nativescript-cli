import BaseError from './base';

export default class AppProblemError extends BaseError {
  constructor(message = 'There is a problem with this app backend that prevents execution of this operation.'
    + ' Please contact support@kinvey.com for assistance.', debug, code, kinveyRequestId) {
    super('AppProblemError', message, debug, code, kinveyRequestId);
  }
}
