import { Middleware } from 'kinvey-js-sdk/dist/request';
import { request as HttpRequest, HttpResponse } from 'http';
import { device } from 'platform'

function deviceInformation() {
  const platform = device.os;
  const version = device.osVersion;
  const manufacturer = device.manufacturer;

  // Return the device information string.
  // const parts = [`js-${pkg.name}/${pkg.version}`];
  const parts = ['js-kinvey-nativescript-sdk/3.5.0'];

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

  handle(request: any) {
    const { url, method, headers, body, timeout, followRedirect } = request;

    // Add the X-Kinvey-Device-Information header
    headers['X-Kinvey-Device-Information'] = deviceInformation();

    return HttpRequest({
      method: method,
      headers: headers,
      url: url,
      content: body,
      timeout: timeout,
      dontFollowRedirects: followRedirect
    })
      .then((response: HttpResponse) => {
        return {
          response: {
            statusCode: response.statusCode,
            headers: response.headers,
            data: response.content.toString()
          }
        };
      });
  }

  cancel() {
    return Promise.resolve();
  }
}
