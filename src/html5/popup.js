import { EventEmitter } from 'events';
import bind from 'lodash/bind';
import isFunction from 'lodash/isFunction';

export default class Popup extends EventEmitter {
  open(url = '/') {
    let interval;
    let eventListeners;
    let popupWindow;

    // loadStartCallback
    const loadStartCallback = (event) => {
      this.emit('loadstart', event);
    };

    // loadStopCallback
    const loadStopCallback = (event) => {
      this.emit('loadstop', event);
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

      // Remove event listeners
      if (popupWindow && isFunction(popupWindow.removeEventListener)) {
        popupWindow.removeEventListener('loadstart', eventListeners.loadStopCallback);
        popupWindow.removeEventListener('loadstop', eventListeners.loadStopCallback);
        popupWindow.removeEventListener('loaderror', eventListeners.loadErrorCallback);
        popupWindow.removeEventListener('exit', eventListeners.exitCallback);
      }

      // Emit closed
      this.emit('exit');
    };

    // Bind event listeners
    eventListeners = {
      loadStartCallback: bind(loadStartCallback, this),
      loadStopCallback: bind(loadStopCallback, this),
      loadErrorCallback: bind(loadErrorCallback, this),
      exitCallback: bind(exitCallback, this)
    };

    // Open the popup
    popupWindow = global.open(url, '_blank', 'toolbar=no,location=no');

    if (popupWindow) {
      if (isFunction(popupWindow.addEventListener)) {
        popupWindow.addEventListener('loadstart', eventListeners.loadStartCallback);
        popupWindow.addEventListener('loadstop', eventListeners.loadStopCallback);
        popupWindow.addEventListener('loaderror', eventListeners.loadErrorCallback);
        popupWindow.addEventListener('exit', eventListeners.exitCallback);
      }

      // Check if the popup is closed has closed every 100ms
      interval = setInterval(() => {
        if (popupWindow.closed) {
          eventListeners.exitCallback();
        } else {
          try {
            eventListeners.loadStopCallback({
              url: popupWindow.location.href
            });
          } catch (error) {
            // Just catch the error
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
