let deviceReady;

// Helper function to detect the browser name and version.
function browserDetect(ua) {
  // Cast arguments.
  ua = ua.toLowerCase();

  // User-Agent patterns.
  const rChrome = /(chrome)\/([\w]+)/;
  const rFirefox = /(firefox)\/([\w.]+)/;
  const rIE = /(msie) ([\w.]+)/i;
  const rOpera = /(opera)(?:.*version)?[ \/]([\w.]+)/;
  const rSafari = /(safari)\/([\w.]+)/;

  return rChrome.exec(ua) || rFirefox.exec(ua) || rIE.exec(ua) ||
    rOpera.exec(ua) || rSafari.exec(ua) || [];
}

function deviceInformation() {
  let browser;
  let platform;
  let version;
  let manufacturer;
  let id;
  const libraries = [];

  // Platforms.
  if (global.cordova !== undefined && global.device !== undefined) { // PhoneGap
    const device = global.device;
    libraries.push(`phonegap/${device.cordova}`);
    platform = device.platform;
    version = device.version;
    manufacturer = device.model;
    id = device.uuid;
  } else if (global.Titanium !== undefined) { // Titanium.
    libraries.push(`titanium/${global.Titanium.getVersion()}`);

    // If mobileweb, extract browser information.
    if (global.Titanium.Platform.getName() === 'mobileweb') {
      browser = browserDetect(global.Titanium.Platform.getModel());
      platform = browser[1];
      version = browser[2];
      manufacturer = global.Titanium.Platform.getOstype();
    } else {
      platform = global.Titanium.Platform.getOsname();
      version = global.Titanium.Platform.getVersion();
      manufacturer = global.Titanium.Platform.getManufacturer();
    }

    id = global.Titanium.Platform.getId();
  } else if (global.forge !== undefined) { // Trigger.io
    libraries.push(`triggerio/${global.forge.config.platform_version || ''}`);
    id = global.forge.config.uuid;
  } else if (process !== undefined) { // Node.js
    platform = process.title;
    version = process.version;
    manufacturer = process.platform;
  }

  // Libraries.
  if (global.angular !== undefined) { // AngularJS.
    libraries.push(`angularjs/${global.angular.version.full}`);
  }
  if (global.Backbone !== undefined) { // Backbone.js.
    libraries.push(`backbonejs/${global.Backbone.VERSION}`);
  }
  if (global.Ember !== undefined) { // Ember.js.
    libraries.push(`emberjs/${global.Ember.VERSION}`);
  }
  if (global.jQuery !== undefined) { // jQuery.
    libraries.push(`jquery/${global.jQuery.fn.jquery}`);
  }
  if (global.ko !== undefined) { // Knockout.
    libraries.push(`knockout/${global.ko.version}`);
  }
  if (global.Zepto !== undefined) { // Zepto.js.
    libraries.push('zeptojs');
  }

  // Default platform, most likely this is just a plain web app.
  if ((platform === null || platform === undefined) && global.navigator) {
    browser = browserDetect(global.navigator.userAgent);
    platform = browser[1];
    version = browser[2];
    manufacturer = global.navigator.platform;
  }

  // Return the device information string.
  const parts = ['js-kinvey-javascript-sdk-core'];

  if (libraries.length !== 0) { // Add external library information.
    parts.push(`(${libraries.sort().join(', ')})`);
  }

  return parts.concat([platform, version, manufacturer, id]).map(part => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

export class Device {
  static isPhoneGap() {
    if (typeof document !== 'undefined') {
      return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    }

    return false;
  }

  static ready() {
    if (!deviceReady) {
      if (this.isPhoneGap()) {
        deviceReady = new Promise((resolve) => {
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

  static toString() {
    return deviceInformation();
  }
}
