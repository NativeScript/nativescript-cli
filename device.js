import packageJSON from 'json-loader!../package.json';
import { isBrowser } from './utils';

/**
 * @private
 */
export class Device {
  toJSON() {
    if (isBrowser()) {
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
        environment: 'angular',
        library: {
          name: 'angular'
        },
        os: {
          name: browser[1],
          version: browser[2]
        },
        sdk: {
          name: packageJSON.name,
          version: packageJSON.version
        }
      };
    }

    return {
      device: {
        model: global.device.model
      },
      environment: 'phonegap',
      library: {
        name: 'phonegap',
        version: global.device.cordova
      },
      os: {
        name: global.device.platform,
        version: global.device.version
      },
      sdk: {
        name: packageJSON.name,
        version: packageJSON.version
      }
    };
  }
}

