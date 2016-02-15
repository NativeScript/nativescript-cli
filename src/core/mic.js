import { HttpMethod, AuthorizationGrant } from './enums';
import { KinveyError } from './errors';
import NetworkRequest from './requests/networkRequest';
import Device from './device';
import Client from './client';
import Popup from './utils/popup';
import Auth from './auth';
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

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      url: this.client.getUrl(path.join(pathname, authPathname)),
      properties: options.properties,
      data: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code'
      }
    });
    request.setHeader('Content-Type', 'application/x-www-form-urlencoded');

    return request.execute().then(response => {
      if (response.isSuccess()) {
        return response.data.temp_login_uri;
      }

      throw response.error;
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
      const client = new Client({
        protocol: url.parse(loginUrl).protocol,
        host: url.parse(loginUrl).host,
        appKey: this.client.appKey,
        appSecret: this.client.appSecret,
        masterSecret: this.client.masterSecret,
        encryptionKey: this.client.encryptionKey
      });
      const request = new NetworkRequest({
        method: HttpMethod.POST,
        url: client.getUrl(url.parse(loginUrl).pathname, url.parse(loginUrl, true).query),
        properties: options.properties,
        auth: Auth.app,
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
    const request = new NetworkRequest({
      method: HttpMethod.POST,
      url: this.client(tokenPathname),
      properties: options.properties,
      auth: Auth.app,
      data: {
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code
      }
    });
    request.setHeader('Content-Type', 'application/x-www-form-urlencoded');

    return request.execute().then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });
  }
}
