import { BaseError } from './base';

export function ParameterValueOutOfRangeError(message, debug, code, kinveyRequestId) {
  this.name = 'ParameterValueOutOfRangeError';
  this.message = message || 'The value specified for one of the request parameters is out of range.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
ParameterValueOutOfRangeError.prototype = Object.create(BaseError.prototype);
ParameterValueOutOfRangeError.prototype.constructor = ParameterValueOutOfRangeError;
