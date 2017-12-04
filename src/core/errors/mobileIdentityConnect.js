import { BaseError } from './base';

export function MobileIdentityConnectError(message, debug, code, kinveyRequestId) {
  this.name = 'MobileIdentityConnectError';
  this.message = message || 'An error has occurred with Mobile Identity Connect.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
MobileIdentityConnectError.prototype = Object.create(BaseError.prototype);
MobileIdentityConnectError.prototype.constructor = MobileIdentityConnectError;
