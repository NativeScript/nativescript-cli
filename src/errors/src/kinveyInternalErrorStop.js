import BaseError from './base';

export default class KinveyInternalErrorStop extends BaseError {
  constructor(message = 'The Kinvey server encountered an unexpected error.'
    + ' Please contact support@kinvey.com for assistance.', debug, code, kinveyRequestId) {
    super('KinveyInternalErrorStop', message, debug, code, kinveyRequestId);
  }
}
