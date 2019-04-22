import { KinveyError } from './kinvey';

export class PopupError extends KinveyError {
  constructor(message = 'Unable to open a popup on this platform.', debug?: string) {
    super(message, debug);
    this.name = 'PopupError';
  }
}
