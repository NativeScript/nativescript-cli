import { Popup as HTML5Popup } from '../html5/popup';
import { Device } from './device';

export class Popup extends HTML5Popup {
  open(url = '/') {
    const that = this;

    if (!Device.isPhoneGap()) {
      return super.open(url);
    }

    // Check that the InAppBrowser plugin is installed if this is a PhoneGap environment
    if (typeof global.cordova !== 'undefined' && typeof global.cordova.InAppBrowser === 'undefined') {
      throw new Error('Cordova InAppBrowser Plugin is not installed.'
        + ' Please refer to https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-inappbrowser/index.html'
        + ' for help with installing the Cordova InAppBrowser Plugin.');
    }

    const popupWindow = global.open(url, '_blank', 'location=yes');

    if (popupWindow) {
      if (typeof popupWindow.addEventListener === 'function') {
        const eventListeners = {
          loadStartCallback(event) {
            that.emit('loadstart', event);
          },
          loadStopCallback(event) {
            that.emit('loadstop', event);
          },
          loadErrorCallback(event) {
            that.emit('error', event);
          },
          exitCallback() {
            if (popupWindow) {
              if (!popupWindow.closed) {
                popupWindow.close();
              }

              if (typeof popupWindow.removeEventListener === 'function') {
                popupWindow.removeEventListener('loadstart', eventListeners.loadStopCallback);
                popupWindow.removeEventListener('loadstop', eventListeners.loadStopCallback);
                popupWindow.removeEventListener('loaderror', eventListeners.loadErrorCallback);
                popupWindow.removeEventListener('exit', eventListeners.exitCallback);
              }
            }

            that.emit('exit');
          }
        };

        popupWindow.addEventListener('loadstart', eventListeners.loadStartCallback);
        popupWindow.addEventListener('loadstop', eventListeners.loadStopCallback);
        popupWindow.addEventListener('loaderror', eventListeners.loadErrorCallback);
        popupWindow.addEventListener('exit', eventListeners.exitCallback);
      } else {
        const interval = global.setInterval(() => {
          if (popupWindow.closed) {
            global.clearInterval(interval);
            this.emit('exit');
          } else {
            try {
              const event = { url: popupWindow.location.href };
              this.emit('loadstart', event);
              this.emit('loadstop', event);
              this.emit('load', event);
            } catch (error) {
              this.emit('error', error);
            }
          }
        }, 100);
      }
    } else {
      throw new Error('The popup was blocked.');
    }

    return {
      on(...args) {
        return that.on(...args);
      },

      close() {
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }

        return this;
      },

      removeAllListeners(...args) {
        return that.removeAllListeners(...args);
      }
    };
  }

  static open(url) {
    const popup = new Popup();
    return popup.open(url);
  }
}
