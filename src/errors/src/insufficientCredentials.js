import BaseError from './base';

export default class InsufficientCredentialsError extends BaseError {
  constructor(message = 'The credentials used to authenticate this' +
    ' request are not authorized to run' +
    ' this operation. Please retry your' +
    ' request with appropriate credentials.', debug, code, kinveyRequestId) {
    super('InsufficientCredentialsError', message, debug, code, kinveyRequestId);
  }
}
