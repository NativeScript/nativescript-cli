import xhr from 'xhr';
import { Middleware } from '../../core/request';
import { NetworkConnectionError, TimeoutError } from '../../core/errors';
import { isDefined } from '../../core/utils';
import pkg from '../../../package.json';

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

function deviceInformation() {
  const libraries = [];
  let browser;
  let platform;
  let version;
  let manufacturer;

  // Default platform, most likely this is just a plain web app.
  if ((platform === null || platform === undefined) && navigator) {
    browser = browserDetect(navigator.userAgent);
    platform = browser[1];
    version = browser[2];
    manufacturer = navigator.platform;
  }

  // Libraries.
  if (angular !== undefined) { // AngularJS.
    libraries.push(`angularjs/${angular.version.full}`);
  }
  if (Backbone !== undefined) { // Backbone.js.
    libraries.push(`backbonejs/${Backbone.VERSION}`);
  }
  if (Ember !== undefined) { // Ember.js.
    libraries.push(`emberjs/${Ember.VERSION}`);
  }
  if (jQuery !== undefined) { // jQuery.
    libraries.push(`jquery/${jQuery.fn.jquery}`);
  }
  if (ko !== undefined) { // Knockout.
    libraries.push(`knockout/${ko.version}`);
  }
  if (Zepto !== undefined) { // Zepto.js.
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

export class HttpMiddleware extends Middleware {
  constructor(name = 'Http Middleware') {
    super(name);
  }

  get deviceInformation() {
    return deviceInformation();
  }

  handle(request) {
    const promise = new Promise((resolve, reject) => {
      const { url, method, headers, body, timeout, followRedirect } = request;

      // Add the X-Kinvey-Device-Information header
      headers['X-Kinvey-Device-Information'] = this.deviceInformation;

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
    if (isDefined(this.xhrRequest) && isFunction(this.xhrRequest.abort)) {
      this.xhrRequest.abort();
    }

    return Promise.resolve();
  }
}
