import { Promise } from 'es6-promise';
import packageJSON from '../package.json';
let deviceReady;

export class Device {
  static ready() {
    if (!deviceReady) {
      if (Device.isPhoneGap()) {
        deviceReady = new Promise(resolve => {
          const onDeviceReady = () => {
            document.removeEventListener('deviceready', onDeviceReady);
            resolve();
          };

          document.addEventListener('deviceready', onDeviceReady, false);
        });
      } else {
        deviceReady = Promise.resolve();
      }
    }

    return deviceReady;
  }

  static isPhoneGap() {
    if (typeof document !== 'undefined') {
      return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    }

    return false;
  }

  static isBrowser() {
    if (typeof document !== 'undefined') {
      return document.URL.indexOf('http://') !== -1 || document.URL.indexOf('https://') !== -1;
    }

    return false;
  }

  static isiOS() {
    return typeof global.device !== 'undefined' && global.device.platform === 'iOS';
  }

  static isAndroid() {
    return typeof global.device !== 'undefined' && global.device.platform === 'Android';
  }

  static toJSON() {
    const json = {
      device: {},
      platform: {
        name: 'phonegap'
      },
      os: {},
      kinveySDK: {
        name: packageJSON.name,
        version: packageJSON.version
      }
    };

    if (typeof global.device !== 'undefined') {
      json.device.model = global.device.model;
      json.platform.version = global.device.cordova;
      json.os.name = global.device.platform;
      json.os.version = global.device.version;
    }

    return json;
  }
}

// Check that cordova plugins are installed
Device.ready().then(() => {
  if (typeof global.device === 'undefined') {
    throw new Error('Cordova Device Plugin is not installed.'
      + ' Please refer to devcenter.kinvey.com/phonegap-v3.0/guides/getting-started for help with'
      + ' setting up your project.');
  }
});
