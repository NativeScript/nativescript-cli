import { request as httpRequest } from 'tns-core-modules/http';
import { device } from 'tns-core-modules/platform';

export default async function http(request: any) {
  const response = await httpRequest({
    headers: request.headers,
    method: request.method,
    url: request.url,
    content: request.body,
    timeout: request.timeout
  });

  let data = response.content.raw;

  try {
    data = response.content.toString();
  } catch (e) {
    // TODO: Log error
  }

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    data
  };
}

function deviceInformation(sdkInfo) {
  const platform = device.os;
  const version = device.osVersion;
  const manufacturer = device.manufacturer;
  const parts = [`js-${sdkInfo.name}/${sdkInfo.version}`];

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

function deviceInfo(sdkInfo) {
  return {
    hv: 1,
    md: device.model,
    os: device.os,
    ov: device.osVersion,
    sdk: sdkInfo || {
      name: 'SDK unknown (kinvey-http-nativescript)',
      version: 'unknown'
    },
    pv: device.sdkVersion,
    ty: device.deviceType,
    id: device.uuid
  };
}
