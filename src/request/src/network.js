import Promise from 'es6-promise';
import { Buffer } from 'buffer/';
import qs from 'qs';
import assign from 'lodash/assign';
import defaults from 'lodash/defaults';
import isEmpty from 'lodash/isEmpty';

import Query from 'src/query';
import Aggregation from 'src/aggregation';
import { isDefined, appendQuery } from 'src/utils';
import { InvalidCredentialsError, NoActiveUserError, KinveyError } from 'src/errors';
import { SocialIdentity } from 'src/identity';
import Request, { RequestMethod } from './request';
import CacheRequest from './cache';
import Headers from './headers';
import { KinveyResponse } from './response';
import { NetworkRack } from './rack';


export default class NetworkRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.rack = NetworkRack;
  }
}

/**
 * @private
 * Enum for Auth types.
 */
const AuthType = {
  All: 'All',
  App: 'App',
  Basic: 'Basic',
  Default: 'Default',
  Master: 'Master',
  None: 'None',
  Session: 'Session'
};
Object.freeze(AuthType);
export { AuthType };

const Auth = {
  /**
   * Authenticate through (1) user credentials, (2) Master Secret, or (3) App
   * Secret.
   *
   * @returns {Object}
   */
  all(client) {
    return Auth.session(client)
      .catch(() => Auth.basic(client));
  },

  /**
   * Authenticate through App Secret.
   *
   * @returns {Object}
   */
  app(client) {
    if (!client.appKey || !client.appSecret) {
      return Promise.reject(
        new Error('Missing client appKey and/or appSecret.'
          + ' Use Kinvey.initialize() to set the appKey and appSecret for the client.')
      );
    }

    return Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.appSecret
    });
  },

  /**
   * Authenticate through (1) Master Secret, or (2) App Secret.
   *
   * @returns {Object}
   */
  basic(client) {
    return Auth.master(client)
      .catch(() => Auth.app(client));
  },

  /**
   * Authenticate through Master Secret.
   *
   * @returns {Object}
   */
  master(client) {
    if (!client.appKey || !client.masterSecret) {
      return Promise.reject(
        new Error('Missing client appKey and/or masterSecret.'
          + ' Use Kinvey.initialize() to set the appKey and masterSecret for the client.')
      );
    }

    return Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.masterSecret
    });
  },

  /**
   * Do not authenticate.
   *
   * @returns {Null}
   */
  none() {
    return Promise.resolve(null);
  },

  /**
   * Authenticate through user credentials.
   *
   * @returns {Object}
   */
  session(client) {
    const activeUser = CacheRequest.getActiveUser(client);

    if (!isDefined(activeUser)) {
      return Promise.reject(
        new NoActiveUserError('There is not an active user. Please login a user and retry the request.')
      );
    }

    return Promise.resolve({
      scheme: 'Kinvey',
      credentials: activeUser._kmd.authtoken
    });
  }
};

/**
 * @private
 */
function byteCount(str) {
  if (str) {
    let count = 0;
    const stringLength = str.length;
    str = String(str || '');

    for (let i = 0; i < stringLength; i += 1) {
      const partCount = encodeURI(str[i]).split('%').length;
      count += partCount === 1 ? 1 : partCount - 1;
    }

    return count;
  }

  return 0;
}

/**
 * @private
 */
export class Properties extends Headers {}

export class KinveyRequest extends NetworkRequest {
  constructor(options = {}) {
    super(options);

    options = assign({
      skipBL: false,
      trace: false
    }, options);

    this.authType = options.authType || AuthType.None;
    this.query = options.query;
    this.aggregation = options.aggregation;
    this.properties = options.properties || new Properties();
    this.skipBL = options.skipBL === true;
    this.trace = options.trace === true;
  }

  get appVersion() {
    return this.client.appVersion;
  }

  get query() {
    return this._query;
  }

  set query(query) {
    if (isDefined(query) && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    this._query = query;
  }

  get aggregation() {
    return this._aggregation;
  }

  set aggregation(aggregation) {
    if (isDefined(aggregation) && !(aggregation instanceof Aggregation)) {
      throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
    }

    if (isDefined(aggregation)) {
      this.body = aggregation.toPlainObject();
    }

    this._aggregation = aggregation;
  }

  get headers() {
    const headers = super.headers;

    // Add the Accept header
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json; charset=utf-8');
    }

    // Add the Content-Type header
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json; charset=utf-8');
    }

    // Add the X-Kinvey-API-Version header
    if (!headers.has('X-Kinvey-Api-Version')) {
      headers.set('X-Kinvey-Api-Version', 4);
    }


    // Add or remove the X-Kinvey-Skip-Business-Logic header
    if (this.skipBL === true) {
      headers.set('X-Kinvey-Skip-Business-Logic', true);
    } else {
      headers.remove('X-Kinvey-Skip-Business-Logic');
    }

    // Add or remove the X-Kinvey-Include-Headers-In-Response and X-Kinvey-ResponseWrapper headers
    if (this.trace === true) {
      headers.set('X-Kinvey-Include-Headers-In-Response', 'X-Kinvey-Request-Id');
      headers.set('X-Kinvey-ResponseWrapper', true);
    } else {
      headers.remove('X-Kinvey-Include-Headers-In-Response');
      headers.remove('X-Kinvey-ResponseWrapper');
    }

    // Add or remove the X-Kinvey-Client-App-Version header
    if (this.appVersion) {
      headers.set('X-Kinvey-Client-App-Version', this.appVersion);
    } else {
      headers.remove('X-Kinvey-Client-App-Version');
    }

    // Add or remove X-Kinvey-Custom-Request-Properties header
    if (this.properties) {
      const customPropertiesHeader = this.properties.toString();

      if (!isEmpty(customPropertiesHeader)) {
        const customPropertiesByteCount = byteCount(customPropertiesHeader);

        if (customPropertiesByteCount >= 2000) {
          throw new Error(
            `The custom properties are ${customPropertiesByteCount} bytes.` +
            'It must be less then 2000 bytes.',
            'Please remove some custom properties.');
        }

        headers.set('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
      } else {
        headers.remove('X-Kinvey-Custom-Request-Properties');
      }
    } else {
      headers.remove('X-Kinvey-Custom-Request-Properties');
    }

    // Return the headers
    return headers;
  }

  set headers(headers) {
    super.headers = headers;
  }

  get url() {
    const urlString = super.url;
    const queryString = this.query ? this.query.toQueryString() : {};

    if (isEmpty(queryString)) {
      return urlString;
    }

    return appendQuery(urlString, qs.stringify(queryString));
  }

  set url(urlString) {
    super.url = urlString;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties) {
    if (properties && (properties instanceof Properties) === false) {
      properties = new Properties(properties);
    }

    this._properties = properties;
  }

  getAuthorizationHeader() {
    let promise = Promise.resolve(undefined);

    // Add or remove the Authorization header
    if (this.authType) {
      // Get the auth info based on the set AuthType
      switch (this.authType) {
        case AuthType.All:
          promise = Auth.all(this.client);
          break;
        case AuthType.App:
          promise = Auth.app(this.client);
          break;
        case AuthType.Basic:
          promise = Auth.basic(this.client);
          break;
        case AuthType.Master:
          promise = Auth.master(this.client);
          break;
        case AuthType.None:
          promise = Auth.none(this.client);
          break;
        case AuthType.Session:
          promise = Auth.session(this.client);
          break;
        default:
          promise = Auth.session(this.client)
            .catch((error) => {
              return Auth.master(this.client)
                .catch(() => {
                  throw error;
                });
            });
      }
    }

    return promise
      .then((authInfo) => {
        // Add the auth info to the Authorization header
        if (isDefined(authInfo)) {
          let credentials = authInfo.credentials;

          if (authInfo.username) {
            credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
          }

          return `${authInfo.scheme} ${credentials}`;
        }

        return undefined;
      });
  }

  execute(rawResponse = false, retry = true) {
    return this.getAuthorizationHeader()
      .then((authorizationHeader) => {
        if (isDefined(authorizationHeader)) {
          this.headers.set('Authorization', authorizationHeader);
        } else {
          this.headers.remove('Authorization');
        }
      })
      .then(() => {
        return super.execute();
      })
      .then((response) => {
        if (!(response instanceof KinveyResponse)) {
          response = new KinveyResponse({
            statusCode: response.statusCode,
            headers: response.headers,
            data: response.data
          });
        }

        if (rawResponse === false && response.isSuccess() === false) {
          throw response.error;
        }

        return response;
      })
      .catch((error) => {
        if (error instanceof InvalidCredentialsError && retry === true) {
          const activeUser = CacheRequest.getActiveUser(this.client);

          if (!isDefined(activeUser)) {
            throw error;
          }

          const socialIdentities = isDefined(activeUser._socialIdentity) ? activeUser._socialIdentity : {};
          const sessionKey = Object.keys(socialIdentities)
            .find(sessionKey => socialIdentities[sessionKey].identity === SocialIdentity.MobileIdentityConnect);
          const session = socialIdentities[sessionKey];

          if (isDefined(session)) {
            // Refresh MIC Token
            if (session.identity === SocialIdentity.MobileIdentityConnect) {
              const refreshMICRequest = new KinveyRequest({
                method: RequestMethod.POST,
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                authType: AuthType.App,
                url: `${session.hostname || this.client.micHostname}/oauth/token`,
                body: {
                  grant_type: 'refresh_token',
                  client_id: session.client_id,
                  redirect_uri: session.redirect_uri,
                  refresh_token: session.refresh_token
                },
                timeout: this.timeout,
                properties: this.properties
              });

              return refreshMICRequest.execute(false, false)
                .then(response => response.data)
                .then((newSession) => {
                  // Login the user with the new mic session
                  const data = {};
                  data._socialIdentity = {};
                  data._socialIdentity[session.identity] = newSession;

                  // Login the user
                  const loginRequest = new KinveyRequest({
                    method: RequestMethod.POST,
                    authType: AuthType.App,
                    url: `${this.client.apiHostname}/user/${this.client.appKey}/login`,
                    properties: this.properties,
                    body: data,
                    timeout: this.timeout,
                    client: this.client
                  });
                  return loginRequest.execute(false, false)
                    .then(response => response.data);
                })
                .then((user) => {
                  user._socialIdentity[session.identity] = defaults(user._socialIdentity[session.identity], session);
                  return CacheRequest.setActiveUser(this.client, user);
                })
                .then(() => this.execute(rawResponse, false))
                .catch(() => {
                  throw error;
                });
            }
          }

          throw error;
        }

        throw error;
      });
  }
}
