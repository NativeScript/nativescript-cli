import isString from 'lodash/isString';
import urljoin from 'url-join';
import { parse } from 'url';
import { Base64 } from 'js-base64';
import { getConfig } from 'kinvey-app';
import { formatKinveyUrl, KinveyRequest, RequestMethod } from 'kinvey-http';
import { open } from 'kinvey-popup';
import { KinveyError, MobileIdentityConnectError } from 'kinvey-errors';

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

function getTempLoginUrl(clientId, redirectUri, version) {
  const { auth } = getConfig();
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
    url: formatKinveyUrl(auth.protocol, auth.host, urljoin(`v${version}`, '/oauth/auth')),
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code'
    }
  });
  return request
    .execute()
    .then((response) => response.data);
}

function loginWithPopup(clientId, redirectUri, version) {
  return new Promise(async (resolve, reject) => {
    const { auth } = getConfig();
    const query = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid'
    };
    const url = formatKinveyUrl(auth.protocol, auth.host, urljoin(`v${version}`, '/oauth/auth'), query);
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

function loginWithUrl(url, username, password, clientId, redirectUri) {
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
    url: url.temp_login_uri,
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      username,
      password,
      scope: 'openid'
    }
  });
  return request
    .execute()
    .then((response) => {
      const location = response.headers.get('location');

      if (!location) {
        return Promise.reject(
          new MobileIdentityConnectError(`Unable to authorize user with username ${username}.`,
            'A location header was not provided with a code to exchange for an auth token.')
        );
      }

      const parsedLocation = parse(location, true) || {};
      const query = parsedLocation.query || {};
      return query.code;
    });
}

function getTokenWithCode(code, clientId, redirectUri) {
  const { auth } = getConfig();
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
    url: formatKinveyUrl(auth.protocol, auth.host, '/oauth/token'),
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code
    }
  });
  return request
    .execute()
    .then((response) => {
      const token = response.data;
      return Object.assign({}, {
        identity: IDENTITY,
        client_id: clientId,
        redirect_uri: redirectUri,
        protocol: auth.protocol,
        host: auth.host
      }, token);
    });
}

export function login(redirectUri, authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage, options = {}) {
  const { appKey } = getConfig();
  const { micId, version = 3, username, password } = options;
  let clientId = appKey;
  let promise;

  if (!isString(redirectUri)) {
    return Promise.reject(
      new KinveyError('A redirectUri is required and must be a string.')
    );
  }

  if (isString(micId)) {
    clientId = `${clientId}.${micId}`;
  }

  if (authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI) {
    promise = getTempLoginUrl(clientId, redirectUri, version)
      .then((url) => loginWithUrl(url, username, password, clientId, redirectUri))
  } else {
    promise = loginWithPopup(clientId, redirectUri, version);
  }

  return promise
    .then((code) => getTokenWithCode(code, clientId, redirectUri));
}
