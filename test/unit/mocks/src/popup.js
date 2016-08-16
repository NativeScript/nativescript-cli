import { EventEmitter } from 'events';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

export class Popup extends EventEmitter {
  async open(url = '/') {
    // Open the popup
    this.popupWindow = global.open(url, '_blank', 'toolbar=no,location=no');

    if (this.popupWindow) {
      // Check if the popup is closed has closed every 100ms
      this.interval = setInterval(() => {
        if (this.popupWindow.closed) {
          this.exitCallback();
        } else {
          try {
            this.loadStopCallback({
              url: this.popupWindow.location.href
            });
          } catch (error) {
            // Just catch the error
          }
        }
      }, 100);
    } else {
      throw new Error('The popup was blocked.');
    }

    return this;
  }

  async close() {
    if (this.popupWindow) {
      this.popupWindow.close();
    }

    return this;
  }

  loadStartCallback(event) {
    this.emit('loadstart', event);
  }

  loadStopCallback(event) {
    this.emit('loadstop', event);
  }

  loadErrorCallback(event) {
    this.emit('error', event);
  }

  exitCallback() {
    clearInterval(this.interval);
    this.emit('closed');
  }
}
