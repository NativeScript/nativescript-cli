import { EventEmitter } from 'events';

export class Popup extends EventEmitter {
  open(url = '/') {
    let interval;
    let popupWindow;

    // loadCallback
    const loadCallback = (event) => {
      this.emit('loadstart', event);
      this.emit('load', event);
    };

    // loadErrorCallback
    const loadErrorCallback = (event) => {
      this.emit('error', event);
    };

    // exitCallback
    const exitCallback = () => {
      // Clear the interval
      clearInterval(interval);

      // Close the popup
      popupWindow.close();
      this.popupWindow = null;

      // Emit closed
      this.emit('exit');
    };

    // Open the popup
    popupWindow = open(url, '_blank', 'toolbar=no,location=no');

    if (popupWindow) {
      // Check if the popup is closed has closed every 100ms
      interval = setInterval(() => {
        if (popupWindow.closed) {
          exitCallback();
        } else {
          try {
            loadCallback({
              url: popupWindow.location.href
            });
          } catch (error) {
            loadErrorCallback(error);
          }
        }
      }, 100);
    } else {
      throw new Error('The popup was blocked.');
    }

    // Set the popupWindow instance
    this.popupWindow = popupWindow;

    // Return this
    return this;
  }

  close() {
    if (this.popupWindow) {
      this.popupWindow.close();
    }

    return this;
  }
}
