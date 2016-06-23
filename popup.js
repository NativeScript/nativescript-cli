import { EventEmitter } from 'events';
import { Device } from './device';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
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
  }

  async open(url = '/') {
    // Wait for the deivce to be ready
    await Device.ready();

    // Check that the InAppBrowser plugin is installed
    if (global.cordova && !global.cordova.InAppBrowser) {
      throw new Error('PhoneGap InAppBrowser Plugin is not installed.'
          + ' Please refer to http://http://devcenter.kinvey.com/phonegap/guides/getting-started for help with'
          + ' setting up your project.');
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

    if (Device.isPhoneGap()) {
      this.popup.removeEventListener('loadstart', this.eventListeners.loadStopCallback);
      this.popup.removeEventListener('loadstop', this.eventListeners.loadStopCallback);
      this.popup.removeEventListener('loaderror', this.eventListeners.loadErrorCallback);
      this.popup.removeEventListener('exit', this.eventListeners.exitCallback);
    }

    this.emit('closed');
  }
}
