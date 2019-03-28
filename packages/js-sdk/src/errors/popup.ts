import { KinveyError } from './kinvey';

export class PopupError extends KinveyError {
  constructor(message = 'Unable to open a popup on this platform.') {
    super(message);
    this.name = 'PopupError';
  }
}
