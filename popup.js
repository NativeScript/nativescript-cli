import HTML5Popup from 'kinvey-html5-sdk/dist/popup';
import Device from './device';
import bind from 'lodash/bind';
import isFunction from 'lodash/isFunction';

export default class Popup extends HTML5Popup {
  open(url = '/') {
    if (Device.isPhoneGap() === false) {
      return super.open(url);
    }

    let interval;
    let eventListeners;
    let popupWindow;

    // Check that the InAppBrowser plugin is installed if this is a PhoneGap environment
    if (typeof global.cordova !== 'undefined' && typeof global.cordova.InAppBrowser === 'undefined') {
      throw new Error('Cordova InAppBrowser Plugin is not installed.'
        + ' Please refer to https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-inappbrowser/index.html'
        + ' for help with installing the Cordova InAppBrowser Plugin.');
    }

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
    popupWindow = global.open(url, '_blank', 'location=yes');

    if (popupWindow) {
      if (isFunction(popupWindow.addEventListener)) {
        popupWindow.addEventListener('loadstart', eventListeners.loadStartCallback);
        popupWindow.addEventListener('loadstop', eventListeners.loadStopCallback);
        popupWindow.addEventListener('loaderror', eventListeners.loadErrorCallback);
        popupWindow.addEventListener('exit', eventListeners.exitCallback);
      }
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
