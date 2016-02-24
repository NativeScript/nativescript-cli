import packageJSON from '../../package.json';

/**
 * @private
 */
export default class Device {
  get os() {
    let name = 'mobileweb';
    let version;

    if (this.isCordova()) {
      name = global.device.platform;
      version = global.device.version;
    } else if (this.isTitanium()) {
      const platform = global.Titanium.Platform;
      name = platform.getName() === 'iPhone OS' ? 'ios' : platform.getName();
      version = platform.getVersion();
    }

    return {
      name: name.toLowerCase(),
      version: version
    };
  }

  get platform() {
    let name;
    let version;

    if (this.isCordova()) {
      name = 'cordova';
      version = global.device.cordova;
    } else if (this.isHTML()) {
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
      name = browser[1];
      version = browser[2];
    } else if (this.isNode()) {
      name = global.process.title;
      version = global.process.version;
    } else if (this.isTitanium()) {
      name = 'titanium';
      version = global.Titanium.getVersion();
    }

    return {
      name: name.toLowerCase(),
      version: version
    };
  }

  get library() {
    return {
      build: process.env.KINVEY_PLATFORM_ENV || 'html5',
      version: packageJSON.version
    };
  }

  isCordova() {
    try {
      return typeof global.cordova !== 'undefined' && typeof global.device !== 'undefined';
    } catch (err) {
      // Catch any errors
    }

    return false;
  }

  isHTML() {
    try {
      return typeof window !== 'undefined';
    } catch (err) {
      // Catch any errors
    }

    return false;
  }

  isNode() {
    try {
      return Object.prototype.toString.call(global.process) === '[object process]';
    } catch (err) {
      // Catch any errors
    }

    return false;
  }

  isPhoneGap() {
    return this.isCordova();
  }

  isTitanium() {
    return typeof global.Titanium !== 'undefined';
  }

  toJSON() {
    return {
      os: this.os,
      platform: this.platform,
      library: this.library
    };
  }
}
