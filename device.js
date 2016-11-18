import pkg from '../package.json';
import Promise from 'es6-promise';
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

export function deviceInformation() {
  const libraries = [];
  let browser;
  let platform;
  let version;
  let manufacturer;
  let id;

  if (global.cordova !== undefined && global.device !== undefined) { // PhoneGap
    const device = global.device;
    libraries.push(`phonegap/${device.cordova}`);
    platform = device.platform;
    version = device.version;
    manufacturer = device.model;
    id = device.uuid;
  }

  // Default platform, most likely this is just a plain web app.
  if ((platform === null || platform === undefined) && global.navigator) {
    browser = browserDetect(global.navigator.userAgent);
    platform = browser[1];
    version = browser[2];
    manufacturer = global.navigator.platform;
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

  // Return the device information string.
  const parts = [`js-${pkg.name}/${pkg.version}`];

  if (libraries.length !== 0) { // Add external library information.
    parts.push(`(${libraries.sort().join(', ')})`);
  }

  return parts.concat([platform, version, manufacturer, id]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}


export default class Device {
  static isPhoneGap() {
    if (typeof document !== 'undefined') {
      return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    }

    return false;
  }

  static isiOS() {
    return typeof global.device !== 'undefined' && global.device.platform.toLowerCase() === 'ios';
  }

  static isAndroid() {
    return typeof global.device !== 'undefined' && global.device.platform.toLowerCase() === 'android';
  }

  static ready() {
    if (typeof deviceReady === 'undefined') {
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
}

// Check that cordova plugins are installed
if (Device.isPhoneGap()) {
  Device.ready().then(() => {
    if (typeof global.device === 'undefined') {
      throw new Error('Cordova Device Plugin is not installed.'
        + ' Please refer to devcenter.kinvey.com/phonegap-v3.0/guides/getting-started for help with'
        + ' setting up your project.');
    }
  });
}
