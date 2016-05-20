import packageJSON from '../package.json';
let online = global.navigator.onLine;

global.document.addEventListener('online', () => {
  online = true;
}, false);

global.document.addEventListener('offline', () => {
  online = false;
}, false);

export default class Device {
  static isOnline() {
    return online;
  }

  static networkState() {
    return undefined;
  }

  static isPhoneGap() {
    return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
  }

  static isBrowser() {
    return document.URL.indexOf('http://') !== -1 && document.URL.indexOf('https://') !== -1;
  }

  static isiOS() {
    return typeof global.device !== 'undefined' && global.device.platform === 'iOS';
  }

  static isAndroid() {
    return typeof global.device !== 'undefined' && global.device.platform === 'Android';
  }

  static toJSON() {
    if (Device.isBrowser()) {
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

      return {
        device: {
          model: global.navigator.userAgent
        },
        platform: {
          name: 'phonegap',
        },
        os: {
          name: browser[1],
          version: browser[2]
        },
        kinveySDK: {
          name: packageJSON.name,
          version: packageJSON.version
        }
      };
    }

    return {
      device: {
        model: global.device.model
      },
      platform: {
        name: 'phonegap',
        version: global.device.cordova
      },
      os: {
        name: global.device.platform,
        version: global.device.version
      },
      kinveySDK: {
        name: packageJSON.name,
        version: packageJSON.version
      }
    };
  }
}

// Expose the device class globally
global.KinveyDevice = Device;
