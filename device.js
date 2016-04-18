import packageJSON from 'json-loader!../package.json';

/**
 * @private
 */
export class Device {
  toJSON() {
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
        name: 'angular',
        version: global.angular.version.full
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
}
