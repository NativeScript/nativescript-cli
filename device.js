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

    if (PhoneGapDevice.isBrowser()) {
      const userAgent = global.navigator.userAgent.toLowerCase();
      const rChrome = /(chrome)\/([\w]+)/;
      const rFirefox = /(firefox)\/([\w.]+)/;
      const rIE = /(msie) ([\w.]+)/i;
      const rOpera = /(opera)(?:.*version)?[ \/]([\w.]+)/;
      const rSafari = /(safari)\/([\w.]+)/;
      const browser = rChrome.exec(userAgent) ||
                      rFirefox.exec(userAgent) ||
                      rIE.exec(userAgent) ||
                      rOpera.exec(userAgent) ||
                      rSafari.exec(userAgent) ||
                      [];

      json.device.model = global.navigator.userAgent;
      json.os.name = browser[1];
      json.os.version = browser[2];
    } else {
      if (typeof global.device !== 'undefined') {
        json.device.model = global.device.model;
        json.platform.version = global.device.cordova;
        json.os.name = global.device.platform;
        json.os.version = global.device.version;
      }
    }

    return json;
  }
}
