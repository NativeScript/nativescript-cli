import BaseError from './base';

export default class KinveyInternalErrorRetry extends BaseError {
  constructor(message = 'The Kinvey server encountered an unexpected error.'
    + ' Please retry your request.', debug, code, kinveyRequestId) {
    super('KinveyInternalErrorRetry', message, debug, code, kinveyRequestId);
  }
}
