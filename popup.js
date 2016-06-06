import { EventEmitter } from 'events';
import { PhoneGapDevice } from './device';
import bind from 'lodash/bind';

export class PhoneGapPopup extends EventEmitter {
  constructor() {
    super();

    // Create some event listeners
    this.eventListeners = {
      loadStartCallback: bind(this.loadStartCallback, this),
      loadStopCallback: bind(this.loadStopCallback, this),
      loadErrorCallback: bind(this.loadErrorCallback, this),
      exitCallback: bind(this.exitCallback, this)
    };

    // Listen fro the deviceready event
    if (PhoneGapDevice.isPhoneGap()) {
      this.deviceReady = new Promise(resolve => {
        const onDeviceReady = bind(() => {
          document.removeEventListener('deviceready', onDeviceReady);
          resolve();
        }, this);

        document.addEventListener('deviceready', onDeviceReady, false);
      });
    } else {
      this.deviceReady = Promise.resolve();
    }
  }

  async open(url = '/') {
    // Wait for the deivce to be ready
    await this.deviceReady;

    if (PhoneGapDevice.isPhoneGap()) {
      // Check that the InAppBrowser plugin is installed
      if (global.cordova && !global.cordova.InAppBrowser) {
        throw new Error('PhoneGap InAppBrowser Plugin is not installed.',
            'Please refer to http://http://devcenter.kinvey.com/phonegap/guides/getting-started for help with ' +
            'setting up your project.');
      }

      // Open the popup
      this.popup = global.open(url, '_blank', 'location=yes');

      // Listen for popup events
      if (this.popup) {
        this.popup.addEventListener('loadstart', this.eventListeners.loadStartCallback);
        this.popup.addEventListener('loadstop', this.eventListeners.loadStopCallback);
        this.popup.addEventListener('loaderror', this.eventListeners.loadErrorCallback);
        this.popup.addEventListener('exit', this.eventListeners.exitCallback);
      } else {
        throw new Error('The popup was blocked.');
      }
    } else {
      // Open the popup
      this.popup = global.open(url, '_blank', 'toolbar=no,location=no');

      if (this.popup) {
        // Check if the popup is closed or redirect every 100ms
        this.interval = setInterval(() => {
          if (this.popup.closed) {
            this.exitCallback();
          } else {
            try {
              this.loadStopCallback({
                url: this.popup.location.href
              });
            } catch (error) {
              // Just catch the error
            }
          }
        }, 100);
      } else {
        throw new Error('The popup was blocked.');
      }
    }

    return this;
  }

  async close() {
    if (this.popup) {
      this.popup.close();
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

    if (PhoneGapDevice.isPhoneGap()) {
      this.popup.removeEventListener('loadstart', this.eventListeners.loadStopCallback);
      this.popup.removeEventListener('loadstop', this.eventListeners.loadStopCallback);
      this.popup.removeEventListener('loaderror', this.eventListeners.loadErrorCallback);
      this.popup.removeEventListener('exit', this.eventListeners.exitCallback);
    }

    this.emit('closed');
  }
}
