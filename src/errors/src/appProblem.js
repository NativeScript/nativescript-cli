import BaseError from './base';

function AppProblemError(message, debug, code, kinveyRequestId) {
  this.name = 'AppProblemError';
  this.message = message || 'There is a problem with this app backend that prevents execution of this operation. Please contact support@kinvey.com for assistance.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
AppProblemError.prototype = Object.create(BaseError.prototype);
AppProblemError.prototype.constructor = AppProblemError;
export default AppProblemError;
