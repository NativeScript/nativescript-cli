import packageJSON from '../package.json';

export class PhoneGapDevice {
  static isPhoneGap() {
    return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
  }

  static isBrowser() {
    return document.URL.indexOf('http://') !== -1 || document.URL.indexOf('https://') !== -1;
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
