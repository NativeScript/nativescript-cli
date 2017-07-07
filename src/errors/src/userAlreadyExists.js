import BaseError from './base';

function UserAlreadyExistsError(message, debug, code, kinveyRequestId) {
  this.name = 'UserAlreadyExistsError';
  this.message = message || 'This username is already taken. Please retry your request with a different username.';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
UserAlreadyExistsError.prototype = Object.create(BaseError.prototype);
UserAlreadyExistsError.prototype.constructor = UserAlreadyExistsError;
export default UserAlreadyExistsError;