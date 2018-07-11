import isString from 'lodash/isString';
import urljoin from 'url-join';
import { parse } from 'url';
import { getConfig } from '../client';
import {
  execute,
  getKinveyClientAuthorizationHeader,
  formatKinveyAuthUrl,
  Request,
  RequestMethod,
  Headers
} from '../http';
import * as CorePopup from './popup';


export const IDENTITY = 'kinveyAuth';

/**
 * @private
 */
let Popup = CorePopup;

/**
 * @private
 */
export function use(CustomPopup) {
  Popup = CustomPopup;
}

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
  const { appSecret } = getConfig();
  const url = formatKinveyAuthUrl(urljoin(`v${version}`, '/oauth/auth'));
  const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
  const authorizationHeader = getKinveyClientAuthorizationHeader(clientId, appSecret);
  headers.set(authorizationHeader.name, authorizationHeader.value);
  const request = new Request({
    method: RequestMethod.POST,
    headers,
    url,
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code'
    }
  });
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
    const popup = await Popup.open(url);
    let redirected = false;

    popup.on('load', (event) => {
      try {
        if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
          const parsedUrl = url.parse(event.url, true);
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

    popup.on('close', () => {
      if (!redirected) {
        popup.removeAllListeners();
        reject(new Error('Login has been cancelled.'));
      }
    });
  });
}

async function loginWithUrl(url, username, password, clientId, redirectUri) {
  const { appSecret } = getConfig();
  const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
  const authorizationHeader = getKinveyClientAuthorizationHeader(clientId, appSecret);
  headers.set(authorizationHeader.name, authorizationHeader.value);
  const request = new Request({
    method: RequestMethod.POST,
    headers,
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
  const response = await execute(request);
  const location = response.headers.get('location');
  const parsedLocation = parse(location, true) || {};
  const query = parsedLocation.query || {};
  return query.code;
}

async function getTokenWithCode(code, clientId, redirectUri) {
  const { appSecret } = getConfig();
  const url = formatKinveyAuthUrl('/oauth/token');
  const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
  const authorizationHeader = getKinveyClientAuthorizationHeader(clientId, appSecret);
  headers.set(authorizationHeader.name, authorizationHeader.value);
  const request = new Request({
    method: RequestMethod.POST,
    headers,
    url,
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code
    }
  });
  const response = await execute(request);
  return response.data;
}

export async function login(
  redirectUri,
  authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage,
  options = {}) {
  const { appKey } = getConfig();
  const { micId, version, username, password } = options;
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
