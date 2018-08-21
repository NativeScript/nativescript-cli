import isString from 'lodash/isString';
import urljoin from 'url-join';
import { parse } from 'url';
import { getConfig } from '../client';
import {
  execute,
  formatKinveyAuthUrl,
  KinveyRequest,
  RequestMethod
} from '../http';
import { open } from './popup';

// Export identity
export const IDENTITY = 'kinveyAuth';

/**
 * Enum for Mobile Identity Connect authorization grants.
 * @property  {string}    AuthorizationCodeLoginPage   AuthorizationCodeLoginPage grant
 * @property  {string}    AuthorizationCodeAPI         AuthorizationCodeAPI grant
 */
export const AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
Object.freeze(AuthorizationGrant);

async function getTempLoginUrl(clientId, redirectUri, version) {
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth() {
      const { appSecret } = getConfig();
      const credentials = Buffer.from(`${clientId}:${appSecret}`).toString('base64');
      return `Basic ${credentials}`;
    },
    url: formatKinveyAuthUrl(urljoin(`v${version}`, '/oauth/auth')),
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code'
    }
  });
  request.headers.set('Content-Type', 'application/x-www-form-urlencoded');
  const response = await execute(request);
  return response.data;
}

function loginWithPopup(clientId, redirectUri, version) {
  return new Promise(async (resolve, reject) => {
    const query = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid'
    };
    const url = formatKinveyAuthUrl(urljoin(`v${version}`, '/oauth/auth'), query);
    const popup = open(url);
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
            reject(new Error(error, error_description));
          } else {
            reject(new Error('No code or error was provided.'));
          }
        }
      } catch (error) {
        // Just catch the error
      }
    });

    popup.onClosed(() => {
      if (!redirected) {
        popup.removeAllListeners();
        reject(new Error('Login has been cancelled.'));
      }
    });
  });
}

async function loginWithUrl(url, username, password, clientId, redirectUri) {
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth() {
      const { appSecret } = getConfig();
      const credentials = Buffer.from(`${clientId}:${appSecret}`).toString('base64');
      return `Basic ${credentials}`;
    },
    url,
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      username,
      password,
      scope: 'openid'
    }
  });
  request.headers.set('Content-Type', 'application/x-www-form-urlencoded');
  const response = await execute(request);
  const location = response.headers.get('location');
  const parsedLocation = parse(location, true) || {};
  const query = parsedLocation.query || {};
  return query.code;
}

async function getTokenWithCode(code, clientId, redirectUri) {
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    url: formatKinveyAuthUrl('/oauth/token'),
    auth() {
      const { appSecret } = getConfig();
      return Buffer.from(`${clientId}:${appSecret}`).toString('base64');
    },
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code
    }
  });
  request.headers.set('Content-Type', 'application/x-www-form-urlencoded');
  const response = await execute(request);
  return response.data;
}

export async function login(
  redirectUri,
  authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage,
  options = {}) {
  const { appKey } = getConfig();
  const { micId, version = 3, username, password } = options;
  let clientId = appKey;
  let code;

  if (!isString(redirectUri)) {
    return Promise.reject(new Error('A redirectUri is required and must be a string.'));
  }

  if (isString(micId)) {
    clientId = `${clientId}.${micId}`;
  }

  if (authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI) {
    const url = await getTempLoginUrl(clientId, redirectUri, version);
    code = await loginWithUrl(url, username, password, clientId, redirectUri);
  } else {
    code = await loginWithPopup(clientId, redirectUri, version);
  }

  const token = await getTokenWithCode(code, clientId, redirectUri);
  return token;
}
