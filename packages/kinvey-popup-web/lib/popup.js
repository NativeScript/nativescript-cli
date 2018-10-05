"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;

var _events = require("events");

var _kinveyPopup = require("kinvey-popup");

const LOADED_EVENT = 'loaded';
const CLOSED_EVENT = 'closed';
const ERROR_EVENT = 'error';

class Popup extends _events.EventEmitter {
  constructor(popupWindow) {
    super();
    this.popupWindow = popupWindow;
    this.interval = window.setInterval(() => {
      if (popupWindow.closed) {
        this.close();
      } else {
        try {
          const event = {
            url: popupWindow.location.href
          };
          this.emit(LOADED_EVENT, event);
        } catch (error) {
          if (error.code !== window.DOMException.SECURITY_ERR) {
            this.emit(ERROR_EVENT, error);
          }
        }
      }
    }, 100);
  }

  isClosed() {
    return this.popupWindow.closed;
  }

  onLoaded(listener) {
    return this.on(LOADED_EVENT, listener);
  }

  onClosed(listener) {
    return this.on(CLOSED_EVENT, listener);
  }

  onError(listener) {
    return this.on(ERROR_EVENT, listener);
  }

  async close() {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = null;
    }

    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
      this.popupWindow = null;
    }

    this.emit(CLOSED_EVENT);
    return this;
  }

  static open(url) {
    const popupWindow = window.open(url, '_blank', 'toolbar=no,location=no');

    if (!popupWindow) {
      throw new Error('The popup was blocked.');
    }

    return new Popup(popupWindow);
  }

}

function register() {
  (0, _kinveyPopup.register)(Popup);
}