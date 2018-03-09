import Promise from 'es6-promise';
import isString from 'lodash/isString';
import url from 'url';
import urljoin from 'url-join';
import { AuthType, RequestMethod, KinveyRequest } from '../request';
import { KinveyError, MobileIdentityConnectError } from '../errors';
import { isDefined } from '../utils';
import { Popup as CorePopup } from './popup';
import { Identity } from './identity';
import { SocialIdentity } from './enums';

let Popup = CorePopup;

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

export class MobileIdentityConnect extends Identity {
  get identity() {
    return SocialIdentity.MobileIdentityConnect;
  }

  static get identity() {
    return SocialIdentity.MobileIdentityConnect;
  }

  static isSupported() {
    return true;
  }

  isSupported() {
    return true;
  }

  _getMicPath(options){
    let pathname = '/oauth/auth';
    let version = 3;

    if (options.version) {
      version = options.version;
    }
    
    if (isString(version) === false) {
      version = String(version);
    }

    return urljoin(version.indexOf('v') === 0 ? version : `v${version}`, pathname);
  }

  login(redirectUri, authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage, options = {}) {
    let clientId = this.client.appKey;

    if (isString(options.micId)) {
      clientId = `${clientId}.${options.micId}`;
    }

    const promise = Promise.resolve()
      .then(() => {
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
      })
      .then(code => this.requestToken(code, clientId, redirectUri, options)) // Step 3: Request a token
      .then((session) => {
        session.identity = MobileIdentityConnect.identity;
        session.client_id = clientId;
        session.redirect_uri = redirectUri;
        session.protocol = this.client.micProtocol;
        session.host = this.client.micHost;
        return session;
      });

    return promise;
  }

  refresh(token, clientId, redirectUri, options = {}) {
    return Promise.resolve()
      .then(() => this.refreshToken(token, clientId, redirectUri, options))
      .then((session) => {
        session.identity = MobileIdentityConnect.identity;
        session.client_id = clientId;
        session.redirect_uri = redirectUri;
        session.protocol = this.client.micProtocol;
        session.host = this.client.micHost;
        return session;
      });
  }

  requestTempLoginUrl(clientId, redirectUri, options = {}) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      url: url.format({
        protocol: this.client.micProtocol,
        host: this.client.micHost,
        pathname: this._getMicPath(options)
      }),
      properties: options.properties,
      body: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code'
      }
    });
    return request.execute()
      .then(response => response.data.temp_login_uri);
  }

  requestCodeWithPopup(clientId, redirectUri, options = {}) {
    const promise = Promise.resolve().then(() => {
      return popup.open(url.format({
        protocol: this.client.micProtocol,
        host: this.client.micHost,
        pathname: this._getMicPath(options),
        query: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code'
        }
      }));
    }).then((popup) => {
      const promise = new Promise((resolve, reject) => {
        let redirected = false;

        function loadCallback(event) {
          try {
            if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
              redirected = true;
              popup.removeAllListeners();
              popup.close();
              resolve(url.parse(event.url, true).query.code);
            }
          } catch (error) {
            // Just catch the error
          }
        }

        function errorCallback(event) {
          try {
            if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
              redirected = true;
              popup.removeAllListeners();
              popup.close();
              resolve(url.parse(event.url, true).query.code);
            } else if (redirected === false) {
              popup.removeAllListeners();
              popup.close();
              reject(new KinveyError(event.message, '', event.code));
            }
          } catch (error) {
            // Just catch the error
          }
        }

        function exitCallback() {
          if (redirected === false) {
            popup.removeAllListeners();
            reject(new KinveyError('Login has been cancelled.'));
          }
        }

        popup.on('loadstart', loadCallback);
        popup.on('loadstop', loadCallback);
        popup.on('error', errorCallback);
        popup.on('exit', exitCallback);
      });
      return promise;
    });

    return promise;
  }

  requestCodeWithUrl(loginUrl, clientId, redirectUri, options = {}) {
    const promise = Promise.resolve().then(() => {
      const request = new KinveyRequest({
        method: RequestMethod.POST,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
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
      return request.execute();
    }).then((response) => {
      const location = response.headers.get('location');

      if (location) {
        return url.parse(location, true).query.code;
      }

      throw new MobileIdentityConnectError(`Unable to authorize user with username ${options.username}.`,
        'A location header was not provided with a code to exchange for an auth token.');
    });

    return promise;
  }

  requestToken(code, clientId, redirectUri, options = {}) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.micProtocol,
        host: this.client.micHost,
        pathname: '/oauth/token'
      }),
      properties: options.properties,
      body: {
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code
      }
    });
    return request.execute().then(response => response.data);
  }

  refreshToken(token, clientId, redirectUri, options = {}) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.micProtocol,
        host: this.client.micHost,
        pathname: '/oauth/token'
      }),
      body: {
        grant_type: 'refresh_token',
        client_id: clientId,
        redirect_uri: redirectUri,
        refresh_token: token
      },
      properties: options.properties,
      timeout: options.timeout
    });
    return request.execute().then(response => response.data);
  }

  logout(user, options = {}) {
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.micProtocol,
        host: this.client.micHost,
        pathname: '/oauth/invalidate',
        query: {
          user: user._id
        }
      }),
      properties: options.properties
    });
    return request.execute().then(response => response.data);
  }

  /**
   * @private
   */
  static usePopupClass(PopupClass) {
    if (isDefined(PopupClass)) {
      Popup = PopupClass;
    }
  }
}
