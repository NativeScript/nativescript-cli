import BaseError from './base';

export default class DuplicateEndUsersError extends BaseError {
  constructor(message = 'More than one user registered with this username for this application.'
    + ' Please contact support@kinvey.com for assistance.', debug, code, kinveyRequestId) {
    super('DuplicateEndUsersError', message, debug, code, kinveyRequestId);
  }
}
