import { EventEmitter } from 'events';
import Device from './device';
import bind from 'lodash/bind';

class Popup extends EventEmitter {
  constructor() {
    super();

    // Create some event listeners
    this.eventListeners = {
      loadStopCallback: bind(this.loadStopCallback, this),
      loadErrorCallback: bind(this.loadErrorCallback, this),
      exitCallback: bind(this.exitCallback, this)
    };

    // Listen fro the deviceready event
    if (Device.isPhoneGap()) {
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

    if (Device.isPhoneGap()) {
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
              this.loadErrorCallback({
                message: 'Unable to retrieve popup location due to Cross Origin Domain constraints.'
              });
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
      this.popup = null;
    }

    return this;
  }

  loadStopCallback(event) {
    this.emit('loaded', event.url);
  }

  loadErrorCallback(event) {
    this.emit('error', event.message);
  }

  exitCallback() {
    clearTimeout(this.interval);

    if (Device.isPhoneGap()) {
      this.popup.removeEventListener('loadstop', this.eventListeners.loadStopCallback);
      this.popup.removeEventListener('loaderror', this.eventListeners.loadErrorCallback);
      this.popup.removeEventListener('exit', this.eventListeners.exitCallback);
    }

    this.emit('closed');
  }
}

// Expose the popup class globally
global.KinveyPopup = Popup;
