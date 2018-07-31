import { request as HttpRequest } from 'tns-core-modules/http';
import { device } from 'tns-core-modules/platform';
import { getConnectionType, connectionType } from 'tns-core-modules/connectivity';
import { Middleware } from '../core/request';

function deviceInformation(pkg = <any>{}) {
  const platform = device.os;
  const version = device.osVersion;
  const manufacturer = device.manufacturer;
  const parts = [`js-${pkg.name}/${pkg.version}`];

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

function deviceInformation2(pkg = <any>{}) {
  let networkCondition = 'none';

  switch (getConnectionType()) {
    case connectionType.mobile:
      networkCondition = 'cellular';
      break;
    case connectionType.wifi:
      networkCondition = 'wifi';
      break;
    default:
      networkCondition = 'none';
      break;
  }

  return {
    hv: 1,
    md: device.model,
    os: device.os,
    ov: device.osVersion,
    sdk: pkg.name,
    pv: device.sdkVersion,
    ty: device.deviceType,
    nc: networkCondition,
    id: device.uuid
  };
}

export class HttpMiddleware extends Middleware {
  pkg: any;

  constructor(pkg: any) {
    super();
    this.pkg = pkg;
  }

  handle(request: any): Promise<any> {
    const { url, method, headers, body, timeout, followRedirect } = request;
    const kinveyUrlRegex = /kinvey\.com/gm;

    if (kinveyUrlRegex.test(url)) {
      // Add the X-Kinvey-Device-Information header
      headers['X-Kinvey-Device-Information'] = deviceInformation(this.pkg);
      headers['X-Kinvey-Device-Info'] = JSON.stringify(deviceInformation2(this.pkg));
    }

    const options = {
      method: method,
      headers: headers,
      url: url,
      content: body,
      timeout: timeout,
      dontFollowRedirects: !followRedirect
    };
    return (HttpRequest(options) as any)
      .then((response) => {
        let data = response.content.raw;

        try {
          data = response.content.toString();
        } catch (e) {}

        return {
          response: {
            statusCode: response.statusCode,
            headers: response.headers,
            data: data
          }
        };
      });
  }

  cancel(): Promise<void> {
    return Promise.resolve();
  }
}
