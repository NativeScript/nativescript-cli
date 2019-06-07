import axios from 'axios';
import os from 'os';
import { NetworkError } from 'kinvey-js-sdk/lib/errors/network';
import { TimeoutError } from 'kinvey-js-sdk/lib/errors/timeout';
import { name, version } from '../package.json';

function deviceInformation() {
  const platform = process.title;
  const { version } = process;
  const manufacturer = process.platform;

  // Return the device information string.
  const parts = [`js-${name}/${version}`];

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

export function deviceInfo() {
  return {
    hv: 1,
    os: os.platform(),
    ov: os.release(),
    sdk: {
      name,
      version
    },
    pv: process.version
  };
}

export async function send(request: any) {
  const { url, method, headers, body, timeout } = request;
  let response;

  // Add kinvey device information headers
  if (/kinvey\.com/gm.test(url)) {
    headers['X-Kinvey-Device-Information'] = deviceInformation();
    headers['X-Kinvey-Device-Info'] = JSON.stringify(deviceInfo());
  }

  try {
    response = await axios({
      headers,
      method,
      url,
      data: body,
      timeout
    });
  } catch (error) {
    if (error.code === 'ESOCKETTIMEDOUT'
     || error.code === 'ETIMEDOUT'
     || error.code === 'ECONNABORTED') {
      throw new TimeoutError('The network request timed out.');
    }

    if (error.code === 'ENOENT'
     || !error.response) {
      throw new NetworkError();
    }

    response = error.response;
  }

  return {
    statusCode: response.status,
    headers: response.headers,
    data: response.data
  };
}
