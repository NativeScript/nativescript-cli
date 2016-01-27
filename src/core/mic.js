import { HttpMethod, AuthorizationGrant } from './enums';
import NetworkRequest from './requests/networkRequest';
import Client from './client';
import Popup from './utils/popup';
import Auth from './auth';
import path from 'path';
import url from 'url';
import assign from 'lodash/object/assign';
import isString from 'lodash/lang/isString';
const authPathname = process.env.KINVEY_MIC_AUTH_PATHNAME || '/oauth/auth';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
// const authProvider = process.env.KINVEY_MIC_AUTH_PROVIDER || 'kinveyAuth';
// const sharedInstanceSymbol = Symbol();

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

  login(redirectUri, authorizationGrant = AuthorizationGrant.AuhthorizationCodeLoginPage, options = {}) {
    options = assign({
      client: this.client
    }, options);
    const clientId = options.client.appKey;

    const promise = Promise.resolve().then(() => {
      if (authorizationGrant === AuthorizationGrant.AuhthorizationCodeLoginPage) {
        // Step 1: Request a code
        return this.requestCodeWithPopup(clientId, redirectUri, options);
      } else if (authorizationGrant === AuthorizationGrant.AuhthorizationCodeAPI) {
        // Step 1a: Request a temp login url
        return this.requestTempLoginUrl(clientId, redirectUri, options).then(url => {
          // Step 1b: Request a code
          return this.requestCodeWithUrl(url, clientId, redirectUri, options);
        });
      }

      throw new Error(`The authorization grant ${authorizationGrant} is unsupported. ` +
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
      client: this.client,
      properties: options.properties,
      pathname: path.join(pathname, authPathname),
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

  requestToken(code, clientId, redirectUri, options = {}) {
    const request = new NetworkRequest({
      method: HttpMethod.POST,
      client: this.client,
      properties: options.properties,
      auth: Auth.app,
      pathname: tokenPathname,
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
