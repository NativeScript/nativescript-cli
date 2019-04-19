import { request as tnsRequest } from 'tns-core-modules/http';
import { device } from 'tns-core-modules/platform';
import { name, version } from '../../package.json';

function deviceInformation() {
  const platform = device.os;
  const version = device.osVersion;
  const manufacturer = device.manufacturer;
  const parts = [`js-${name}/${version}`];

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

function deviceInfo() {
  return {
    hv: 1,
    md: device.model,
    os: device.os,
    ov: device.osVersion,
    sdk: {
      name,
      version
    },
    pv: device.sdkVersion,
    ty: device.deviceType,
    id: device.uuid
  };
}

export async function send(request: any): Promise<any> {
  const { url, method, headers, body, timeout } = request;
  const kinveyUrlRegex = /kinvey\.com/gm;

  // Add kinvey device information headers
  if (kinveyUrlRegex.test(url)) {
    headers['X-Kinvey-Device-Information'] = deviceInformation();
    headers['X-Kinvey-Device-Info'] = JSON.stringify(deviceInfo());
  }

  const response = await tnsRequest({
    headers,
    method,
    url,
    content: body,
    timeout
  });

  let data;
  if (response.content) {
    try {
      data = response.content.toString();
    } catch (e) {
      // TODO: log error
      data = response.content.raw;
    }
  }

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    data
  };
}
