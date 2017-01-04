import BaseError from './base';

export default class KinveyError extends BaseError {
  constructor(message, debug, code, kinveyRequestId) {
    super('KinveyError', message, debug, code, kinveyRequestId);
  }
}
