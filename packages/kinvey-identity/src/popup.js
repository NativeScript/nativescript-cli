const { EventEmitter } = require('events');
const { PopupError } = require('kinvey-errors');

exports.Popup = class Popup extends EventEmitter {
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
