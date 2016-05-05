import packageJSON from '../package.json';

/**
 * @private
 */
export default class Device {
  static isBrowser() {
    return typeof global.device !== 'undefined' && global.device.platform === 'browser';
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
        environment: {},
        library: {
          name: 'angular',
          version: global.angular.version.full
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
      environment: {
        name: 'phonegap',
        version: global.device.cordova
      },
      library: {
        name: 'angular',
        version: global.angular.version.full
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
