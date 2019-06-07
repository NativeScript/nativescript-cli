import axios from 'axios';
import { NetworkError } from 'kinvey-js-sdk/lib/errors/network';
import { TimeoutError } from 'kinvey-js-sdk/lib/errors/timeout';
import { name, version } from '../package.json';

// Helper function to detect the browser name and version.
function browserDetect(ua: string) {
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
  const browser = browserDetect(window.navigator.userAgent);
  const platform = browser[1];
  const browserVersion = browser[2];
  const manufacturer = window.navigator.platform;

  // Return the device information string.
  const parts = [`js-${name}/${version}`];

  return parts.concat([platform, browserVersion, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

export function deviceInfo() {
  return {
    hv: 1,
    os: window.navigator.appVersion,
    ov: window.navigator.appVersion,
    sdk: {
      name,
      version
    },
    pv: window.navigator.userAgent
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
