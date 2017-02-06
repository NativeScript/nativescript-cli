import { EventEmitter } from 'events';
import { PopupError } from 'src/errors';

export default class Popup extends EventEmitter {
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
