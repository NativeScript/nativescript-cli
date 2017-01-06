import BaseError from './base';

export default class ParameterValueOutOfRangeError extends BaseError {
  constructor(message = 'The value specified for one of the request parameters is out of range.', debug, code, kinveyRequestId) {
    super('ParameterValueOutOfRangeError', message, debug, code, kinveyRequestId);
  }
}
