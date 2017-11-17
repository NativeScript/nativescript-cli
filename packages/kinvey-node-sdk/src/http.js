const HttpRequest = require('request');
const Promise = require('es6-promise');
const { Middleware } = require('kinvey-request');
const { NetworkConnectionError, TimeoutError } = require('kinvey-errors');
const { isDefined } = require('kinvey-utils/object');

function deviceInformation(pkg) {
  const platform = process.title;
  const { version } = process;
  const manufacturer = process.platform;

  // Return the device information string.
  const parts = [`js-${pkg.name}/${pkg.version}`];

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

class HttpMiddleware extends Middleware {
  constructor(pkg) {
    super();
    this.pkg = pkg
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

      this.httpRequest = HttpRequest({
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
    if (isDefined(this.httpRequest) && typeof this.httpRequest.abort === 'function') {
      this.httpRequest.abort();
    }

    return Promise.resolve();
  }
}
exports.HttpMiddleware = HttpMiddleware;
