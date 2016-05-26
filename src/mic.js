import { KinveyError } from './errors';
import { NetworkRequest } from './requests/network';
import { AuthType, RequestMethod, KinveyRequestConfig } from './requests/request';
import Client from './client';
import path from 'path';
import url from 'url';
import isString from 'lodash/isString';
const authPathname = process.env.KINVEY_MIC_AUTH_PATHNAME || '/oauth/auth';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';

/**
 * Enum for Mobile Identity Connect authorization grants.
 */
const AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
Object.freeze(AuthorizationGrant);
export { AuthorizationGrant };

/**
 * Enum for Social Identities.
 */
const SocialIdentity = {
  Facebook: 'facebook',
  Google: 'google',
  LinkedIn: 'linkedin'
};
Object.freeze(SocialIdentity);
export { SocialIdentity };

/**
 * @private
 */
export class MobileIdentityConnect {
  constructor(client = Client.sharedInstance()) {
    this.client = new Client({
      protocol: process.env.KINVEY_MIC_PROTOCOL || 'https:',
      host: process.env.KINVEY_MIC_HOST || 'auth.kinvey.com',
      appKey: client.appKey,
      appSecret: client.appSecret,
      masterSecret: client.masterSecret,
      encryptionKey: client.encryptionKey
    });
  }

  static get identity() {
    return process.env.KINVEY_MIC_IDENTITY || 'kinveyAuth';
  }

  login(redirectUri, authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage, options = {}) {
    const clientId = this.client.appKey;

    const promise = Promise.resolve().then(() => {
      if (authorizationGrant === AuthorizationGrant.AuthorizationCodeLoginPage) {
        // Step 1: Request a code
        return this.requestCodeWithPopup(clientId, redirectUri, options);
      } else if (authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI) {
        // Step 1a: Request a temp login url
        return this.requestTempLoginUrl(clientId, redirectUri, options)
          .then(url => this.requestCodeWithUrl(url, clientId, redirectUri, options)); // Step 1b: Request a code
      }

      throw new KinveyError(`The authorization grant ${authorizationGrant} is unsupported. ` +
        'Please use a supported authorization grant.');
    }).then(code => this.requestToken(code, clientId, redirectUri, options)); // Step 3: Request a token

    return promise;
  }

  requestTempLoginUrl(clientId, redirectUri, options = {}) {
    let pathname = '/';

    if (options.version) {
      let version = options.version;

      if (!isString(version)) {
        version = String(version);
      }

      pathname = path.join(pathname, version.indexOf('v') === 0 ? version : `v${version}`);
    }

    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: path.join(pathname, authPathname)
      }),
      properties: options.properties,
      body: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code'
      }
    });
    config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
    const request = new NetworkRequest(config);
    return request.execute().then(response => response.data.temp_login_uri);
  }

  requestCodeWithPopup(clientId, redirectUri, options = {}) {
    const promise = Promise.resolve().then(() => {
      let pathname = '/';

      if (options.version) {
        let version = options.version;

        if (!isString(version)) {
          version = String(version);
        }

        pathname = path.join(pathname, version.indexOf('v') === 0 ? version : `v${version}`);
      }

      if (global.KinveyPopup) {
        const popup = new global.KinveyPopup();
        return popup.open(url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: path.join(pathname, authPathname),
          query: {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code'
          }
        }));
      }

      throw new KinveyError('KinveyPopup is undefined.'
        + ` Unable to login authorization grant ${AuthorizationGrant.AuthorizationCodeLoginPage}.`);
    }).then((popup) => {
      const promise = new Promise((resolve, reject) => {
        let redirected = false;

        function loadedCallback(loadedUrl) {
          if (loadedUrl.indexOf(redirectUri) === 0) {
            redirected = true;
            popup.removeAllListeners();
            popup.close();
            resolve(url.parse(loadedUrl, true).query.code);
          }
        }

        function errorCallback(message) {
          popup.removeAllListeners();
          popup.close();
          reject(new Error(message));
        }

        function closedCallback() {
          popup.removeAllListeners();

          if (!redirected) {
            reject(new Error('Login has been cancelled.'));
          }
        }

        popup.on('loaded', loadedCallback);
        popup.on('error', errorCallback);
        popup.on('closed', closedCallback);
      });
      return promise;
    });

    return promise;
  }

  requestCodeWithUrl(loginUrl, clientId, redirectUri, options = {}) {
    const promise = Promise.resolve().then(() => {
      const config = new KinveyRequestConfig({
        method: RequestMethod.POST,
        url: loginUrl,
        properties: options.properties,
        body: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          username: options.username,
          password: options.password
        },
        followRedirect: false
      });
      config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
      const request = new NetworkRequest(config);
      return request.execute();
    }).then(response => {
      const location = response.getHeader('location');

      if (location) {
        return url.parse(location, true).query.code;
      }

      throw new KinveyError(`Unable to authorize user with username ${options.username}.`,
        'A location header was not provided with a code to exchange for an auth token.');
    });

    return promise;
  }

  requestToken(code, clientId, redirectUri, options = {}) {
    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: tokenPathname
      }),
      properties: options.properties,
      body: {
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code
      }
    });
    config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
    const request = new NetworkRequest(config);
    request.automaticallyRefreshAuthToken = false;
    const promise = request.execute().then(response => response.data);
    return promise;
  }
}
