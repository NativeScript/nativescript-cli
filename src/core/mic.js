import { HttpMethod, AuthorizationGrant } from './enums';
import { KinveyError } from './errors';
import NetworkRequest from './requests/networkRequest';
import Device from './device';
import Client from './client';
import Popup from './utils/popup';
import path from 'path';
import url from 'url';
import isString from 'lodash/isString';
const authPathname = process.env.KINVEY_MIC_AUTH_PATHNAME || '/oauth/auth';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';

/**
 * @private
 */
export default class MobileIdentityConnect {
  constructor() {
    const sharedClient = Client.sharedInstance();
    this.client = new Client({
      protocol: 'https:',
      host: 'auth.kinvey.com',
      appKey: sharedClient.appKey,
      appSecret: sharedClient.appSecret,
      masterSecret: sharedClient.masterSecret,
      encryptionKey: sharedClient.encryptionKey
    });
  }

  static get identity() {
    return process.env.KINVEY_MIC_IDENTITY || 'kinveyAuth';
  }

  static login(redirectUri, authorizationGrant, options) {
    const mic = new MobileIdentityConnect();
    return mic.login(redirectUri, authorizationGrant, options);
  }

  login(redirectUri, authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage, options = {}) {
    const clientId = this.client.appKey;
    const device = new Device();

    const promise = Promise.resolve().then(() => {
      if (authorizationGrant === AuthorizationGrant.AuthorizationCodeLoginPage && !device.isNode()) {
        // Step 1: Request a code
        return this.requestCodeWithPopup(clientId, redirectUri, options);
      } else if (authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI && device.isNode()) {
        // Step 1a: Request a temp login url
        return this.requestTempLoginUrl(clientId, redirectUri, options).then(url => {
          // Step 1b: Request a code
          return this.requestCodeWithUrl(url, clientId, redirectUri, options);
        });
      }

      throw new KinveyError(`The authorization grant ${authorizationGrant} is unsupported. ` +
        `Please use a supported authorization grant.`);
    }).then(code => {
      // Step 3: Request a token
      return this.requestToken(code, clientId, redirectUri, options);
    });

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

    return this.client.executeNetworkRequest({
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      pathname: path.join(pathname, authPathname),
      properties: options.properties,
      data: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code'
      }
    }).then(response => {
      return response.data.temp_login_uri;
    });
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

      const popup = new Popup(url.format({
        protocol: this.client.protocl,
        host: this.client.host,
        pathname: path.join(pathname, authPathname),
        query: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code'
        }
      }));
      return popup.open();
    }).then((popup) => {
      return new Promise((resolve, reject) => {
        function loadHandler(loadedUrl) {
          if (loadedUrl.indexOf(redirectUri) === 0) {
            popup.removeAllListeners();
            popup.close();
            resolve(url.parse(loadedUrl, true).query.code);
          }
        }

        function closeHandler() {
          popup.removeAllListeners();
          reject(new Error('Login has been cancelled.'));
        }

        popup.on('load', loadHandler);
        popup.on('close', closeHandler);
      });
    });

    return promise;
  }

  requestCodeWithUrl(loginUrl, clientId, redirectUri, options = {}) {
    const promise = Promise.resolve().then(() => {
      const request = new NetworkRequest({
        method: HttpMethod.POST,
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
      request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
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
    return this.client.executeNetworkRequest({
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      pathname: tokenPathname,
      properties: options.properties,
      auth: this.client.appAuth(),
      data: {
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code
      }
    }).then(response => {
      return response.data;
    });
  }
}
