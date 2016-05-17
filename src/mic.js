import Promise from 'babybird';
import { AuthType, HttpMethod, AuthorizationGrant } from './enums';
import { KinveyError } from './errors';
import { NetworkRequest } from './requests/network';
import { Client } from './client';
import path from 'path';
import url from 'url';
import isString from 'lodash/isString';
const Popup = global.KinveyPopup;
const authPathname = process.env.KINVEY_MIC_AUTH_PATHNAME || '/oauth/auth';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';

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

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: path.join(pathname, authPathname)
      }),
      properties: options.properties,
      data: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code'
      }
    });
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

      const popup = new Popup();
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
      const request = new NetworkRequest({
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        url: loginUrl,
        properties: options.properties,
        data: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          username: options.username,
          password: options.password
        },
        followRedirect: false
      });
      return request.execute();
    }).then(response => {
      const location = response.getHeader('location');

      if (location) {
        return url.parse(location, true).query.code;
      }

      throw new KinveyError(`Unable to authorize user with username ${options.username}.`);
    });

    return promise;
  }

  requestToken(code, clientId, redirectUri, options = {}) {
    const request = new NetworkRequest({
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: tokenPathname
      }),
      properties: options.properties,
      data: {
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code
      }
    });
    request.automaticallyRefreshAuthToken = false;

    const promise = request.execute().then(response => response.data);
    return promise;
  }
}
