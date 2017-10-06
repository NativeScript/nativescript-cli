import BaseError from './base';

function InsufficientCredentialsError(message, debug, code, kinveyRequestId) {
  this.name = 'InsufficientCredentialsError';
  this.message = message || 'The credentials used to authenticate this request are not authorized to run this operation. Please retry your request with appropriate credentials.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
InsufficientCredentialsError.prototype = Object.create(BaseError.prototype);
InsufficientCredentialsError.prototype.constructor = InsufficientCredentialsError;
export default InsufficientCredentialsError;