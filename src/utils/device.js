import packageJSON from '../../package.json';

export function isNode() {
  return typeof module !== 'undefined' && !!module.exports;
}

export function isPhoneGap() {
  return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
}

export function isTitanium() {
  return typeof Titanium !== 'undefined';
}

export function isiOS() {
  if (isNode()) {
    return false;
  } else if (isPhoneGap()) {
    return typeof global.device !== 'undefined' && global.device.platform === 'iOS';
  } else if (isTitanium()) {
    return Titanium.Platform.osname === 'iphone' || Titanium.Platform.osname === 'ipad';
  }

  return /iPad|iPhone|iPod/.test(global.navigator.userAgent) && !window.MSStream;
}

export function isAndroid() {
  if (isNode()) {
    return false;
  } else if (isPhoneGap()) {
    return typeof global.device !== 'undefined' && global.device.platform === 'Android';
  } else if (isTitanium()) {
    return Titanium.Platform.osname === 'android';
  }

  return /Android/.test(global.navigator.userAgent);
}

export function isBrowser() {
  if (isNode()) {
    return false;
  } else if (isPhoneGap()) {
    return typeof global.device !== 'undefined' && global.device.platform === 'browser';
  } else if (isTitanium()) {
    return Titanium.Platform.name === 'mobileweb';
  }

  return !isiOS() && !isAndroid();
}

/**
 * @private
 */
export class Device {
  static toJSON() {
    if (isNode()) {
      const os = require('os');

      return {
        latform: {
          name: 'node',
          version: process.version
        },
        os: {
          name: os.platform(),
          version: os.release()
        },
        kinveySDK: {
          name: packageJSON.name,
          version: packageJSON.version
        }
      };
    } else if (isPhoneGap()) {
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
    } else if (isTitanium()) {
      return {
        device: {
          manufacturer: Titanium.Platform.manufacturer,
          model: Titanium.Platfrom.model
        },
        platform: {
          name: 'titanium',
          version: Titanium.getVersion()
        },
        os: {
          name: Titanium.Platfrom.osname,
          version: Titanium.Platfrom.version
        },
        kinveySDK: {
          name: packageJSON.name,
          version: packageJSON.version
        }
      };
    }

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
        name: 'html5'
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
}
