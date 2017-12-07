import xhr from 'xhr';
import Promise from 'es6-promise';
import { Middleware } from '../core/request';
import { isDefined } from '../core/utils';
import { NetworkConnectionError, TimeoutError } from '../core/errors';

// Helper function to detect the browser name and version.
function browserDetect(ua) {
  // Cast arguments.
  ua = ua.toLowerCase();

  // User-Agent patterns.
  const rChrome = /(chrome)\/([\w]+)/;
  const rFirefox = /(firefox)\/([\w.]+)/;
  const rIE = /(msie) ([\w.]+)/i;
  const rOpera = /(opera)(?:.*version)?[ /]([\w.]+)/;
  const rSafari = /(safari)\/([\w.]+)/;

  return rChrome.exec(ua) || rFirefox.exec(ua) || rIE.exec(ua) ||
    rOpera.exec(ua) || rSafari.exec(ua) || [];
}

function deviceInformation(pkg) {
  const libraries = [];
  let browser;
  let platform;
  let version;
  let manufacturer;

  // Default platform, most likely this is just a plain web app.
  if ((platform === null || platform === undefined) && global.navigator) {
    browser = browserDetect(global.navigator.userAgent);
    platform = browser[1]; // eslint-disable-line prefer-destructuring
    version = browser[2]; // eslint-disable-line prefer-destructuring
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
  const parts = [`js-kinvey-html5-sdk/${pkg.version}`];

  if (libraries.length !== 0) { // Add external library information.
    parts.push(`(${libraries.sort().join(', ')})`);
  }

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

export class Html5HttpMiddleware extends Middleware {
  constructor(pkg) {
    super();
    this.pkg = pkg;
  }

  handle(request) {
    const promise = new Promise((resolve, reject) => {
      const {
        url,
        method,
        headers,
        body,
        timeout,
        followRedirect
      } = request;

      // Add the X-Kinvey-Device-Information header
      headers['X-Kinvey-Device-Information'] = deviceInformation(this.pkg);

      this.xhrRequest = xhr({
        method: method,
        url: url,
        headers: headers,
        body: body,
        followRedirect: followRedirect,
        timeout: timeout
      }, (error, response, body) => {
        if (isDefined(error)) {
          if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT') {
            return reject(new TimeoutError('The network request timed out.'));
          }

          return reject(new NetworkConnectionError('There was an error connecting to the network.', error));
        }

        return resolve({
          response: {
            statusCode: response.statusCode,
            headers: response.headers,
            data: body
          }
        });
      });
    });
    return promise;
  }

  cancel() {
    if (isDefined(this.xhrRequest) && typeof this.xhrRequest.abort === 'function') {
      this.xhrRequest.abort();
    }

    return Promise.resolve();
  }
}
