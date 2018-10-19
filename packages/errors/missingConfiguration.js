import { BaseError } from './base';

export function MissingConfigurationError(message, debug, code, kinveyRequestId) {
  this.name = 'MissingConfigurationError';
  this.message = message || 'Missing configuration error.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
MissingConfigurationError.prototype = Object.create(BaseError.prototype);
MissingConfigurationError.prototype.constructor = MissingConfigurationError;
