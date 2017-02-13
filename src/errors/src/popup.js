import BaseError from './base';

export default class PopupError extends BaseError {
  constructor(message = 'Unable to open a popup on this platform.', debug, code, kinveyRequestId) {
    super('PopupError', message, debug, code, kinveyRequestId);
  }
}
