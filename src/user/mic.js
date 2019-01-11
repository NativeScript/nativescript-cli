import isString from 'lodash/isString';
import urljoin from 'url-join';
import { parse } from 'url';
import { Base64 } from 'js-base64';
import { get as getConfig } from '../kinvey/config';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import openPopup from './popup';
import KinveyError from '../errors/kinvey';

export const IDENTITY = 'kinveyAuth';

function getVersion(version = 3) {
  return String(version).indexOf('v') === 0 ? version : `v${version}`;
}

function loginWithPopup(clientId, redirectUri, version) {
  return new Promise(async (resolve, reject) => {
    const { authProtocol, authHost } = getConfig();
    const query = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid'
    };
    const url = formatKinveyUrl(authProtocol, authHost, urljoin(getVersion(version), '/oauth/auth'), query);
    const popup = openPopup(url);
    let redirected = false;

    popup.onLoaded((event) => {
      try {
        if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
          const parsedUrl = parse(event.url, true);
          // eslint-disable-next-line camelcase
          const { code, error, error_description } = parsedUrl.query || {};

          redirected = true;
          popup.removeAllListeners();
          popup.close();

          if (code) {
            resolve(code);
          } else if (error) {
            reject(new KinveyError(error, error_description));
          } else {
            reject(new KinveyError('No code or error was provided.'));
          }
        }
      } catch (error) {
        // Just catch the error
      }
    });

    popup.onClosed(() => {
      if (!redirected) {
        popup.removeAllListeners();
        reject(new KinveyError('Login has been cancelled.'));
      }
    });
  });
}

async function getTokenWithCode(code, clientId, redirectUri, options = {}) {
  const { authProtocol, authHost } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: () => {
        const { appSecret } = getConfig();
        const credentials = Base64.encode(`${clientId}:${appSecret}`);
        return `Basic ${credentials}`;
      }
    },
    url: formatKinveyUrl(authProtocol, authHost, '/oauth/token'),
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code
    },
    timeout: options.timeout
  });
  const response = await request.execute();
  const token = response.data;
  return Object.assign({}, {
    identity: IDENTITY,
    client_id: clientId,
    redirect_uri: redirectUri,
    protocol: authProtocol,
    host: authHost
  }, token);
}

async function getTokenWithUsernamePassword(username, password, clientId, options = {}) {
  const { authProtocol, authHost } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: () => {
        const { appSecret } = getConfig();
        const credentials = Base64.encode(`${clientId}:${appSecret}`);
        return `Basic ${credentials}`;
      }
    },
    url: formatKinveyUrl(authProtocol, authHost, '/oauth/token'),
    body: {
      grant_type: 'password',
      username,
      password
    },
    timeout: options.timeout
  });
  const response = await request.execute();
  const token = response.data;
  return Object.assign({}, {
    identity: IDENTITY,
    client_id: clientId,
    protocol: authProtocol,
    host: authHost
  }, token);
}

export async function loginWithRedirectUri(redirectUri, options = {}) {
  const { appKey } = getConfig();
  const { micId, version } = options;
  let clientId = appKey;

  if (!isString(redirectUri)) {
    throw new KinveyError('A redirectUri is required and must be a string.');
  }

  if (isString(micId)) {
    clientId = `${clientId}.${micId}`;
  }

  const code = await loginWithPopup(clientId, redirectUri, version);
  const token = await getTokenWithCode(code, clientId, redirectUri, options);
  return token;
}

export async function loginWithUsernamePassword(username, password, options = {}) {
  const { appKey } = getConfig();
  const { micId } = options;
  let clientId = appKey;

  if (!isString(username) || !isString(password)) {
    throw new KinveyError('A username and password are required and must be a string.');
  }

  if (isString(micId)) {
    clientId = `${clientId}.${micId}`;
  }

  const token = await getTokenWithUsernamePassword(username, password, clientId, options);
  return token;
}
