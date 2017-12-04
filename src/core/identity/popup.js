import { EventEmitter } from 'events';
import { PopupError } from '../errors';

export class Popup extends EventEmitter {
  open() {
    throw new PopupError('Unable to open a popup on this platform.');
  }

  close() {
    return this;
  }

  static isSupported() {
    return false;
  }
}
