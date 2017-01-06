import Middleware from './middleware';
import Promise from 'es6-promise';
import httpRequest from 'request';
import { isDefined } from 'common/utils';
import pkg from 'package.json';

function deviceInformation() {
  const platform = process.title;
  const version = process.version;
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

export default class HttpMiddleware extends Middleware {
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

      httpRequest({
        method: method,
        url: url,
        headers: headers,
        body: body,
        followRedirect: followRedirect,
        timeout: timeout
      }, (error, response, body) => {
        if (isDefined(response) === false) {
          reject(error);
        } else {
          resolve({
            response: {
              statusCode: response.statusCode,
              headers: response.headers,
              data: body
            }
          });
        }
      });
    });
    return promise;
  }

  cancel() {
    // if (typeof this.httpRequest !== 'undefined') {
    //   this.httpRequest.abort();
    // }

    return Promise.resolve();
  }
}
