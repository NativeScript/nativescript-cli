import Identity from './identity';
import { AuthType, RequestMethod, KinveyRequest } from '../../request';
import { KinveyError, MobileIdentityConnectError } from '../../errors';
import Promise from 'es6-promise';
import path from 'path';
import url from 'url';
import isString from 'lodash/isString';
const authPathname = process.env.KINVEY_MIC_AUTH_PATHNAME || '/oauth/auth';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
const invalidatePathname = process.env.KINVEY_MIC_INVALIDATE_PATHNAME || '/oauth/invalidate';

/**
 * Enum for Mobile Identity Connect authorization grants.
 * @property  {string}    AuthorizationCodeLoginPage   AuthorizationCodeLoginPage grant
 * @property  {string}    AuthorizationCodeAPI         AuthorizationCodeAPI grant
 */
const AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
Object.freeze(AuthorizationGrant);
export { AuthorizationGrant };

/**
 * @private
 * Enum for Social Identities
 */
const AuthIdentity = {
  Kinvey: process.env.KINVEY_IDENTITY || 'kinvey',
  MobileIdentityConnect: process.env.KINVEY_MIC_IDENTITY || 'kinveyAuth'
};
Object.freeze(AuthIdentity);
export { AuthIdentity };


/**
 * @private
 */
export default class MobileIdentityConnect extends Identity {
  get identity() {
    return AuthIdentity.MobileIdentityConnect;
  }

  static get identity() {
    return AuthIdentity.MobileIdentityConnect;
  }

  isSupported() {
    return true;
  }

  login(redirectUri, authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage, options = {}) {
    const clientId = this.client.appKey;

    const promise = Promise.resolve()
      .then(() => {
        if (authorizationGrant === AuthorizationGrant.AuthorizationCodeLoginPage) {
          return this.requestCodeWithPopup(clientId, redirectUri, options); // Step 1: Request a code
        } else if (authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI) {
          return this.requestTempLoginUrl(clientId, redirectUri, options) // Step 1a: Request a temp login url
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

  requestCodeWithPopup() {
    return Promise.reject(
      new MobileIdentityConnectError('AuthorizationGrant.AuthorizationCodeLoginPage is not supported on this platform.')
    );
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

    const request = new KinveyRequest({
      method: RequestMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      url: url.format({
        protocol: this.client.micProtocol,
        host: this.client.micHost,
        pathname: path.join(pathname, authPathname)
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

      throw new KinveyError(`Unable to authorize user with username ${options.username}.`,
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
        pathname: invalidatePathname,
        query: { user: user._id }
      }),
      properties: options.properties
    });
    return request.execute().then(response => response.data);
  }
}
