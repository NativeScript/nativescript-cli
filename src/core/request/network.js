import Promise from 'es6-promise';
import { Buffer } from 'buffer';
import qs from 'qs';
import assign from 'lodash/assign';
import defaults from 'lodash/defaults';
import isEmpty from 'lodash/isEmpty';
import url from 'url';
import isString from 'lodash/isString';
import { Client } from '../client';
import { Query } from '../query';
import { Aggregation } from '../aggregation';
import { isDefined, appendQuery } from '../utils';
import { InvalidCredentialsError, NoActiveUserError, KinveyError } from '../errors';
import { Request, RequestMethod } from './request';
import { Headers } from './headers';
import { NetworkRack } from './rack';
import { KinveyResponse } from './response';

export class NetworkRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.rack = NetworkRack;
  }
}

export const AuthType = {
  All: 'All',
  App: 'App',
  Basic: 'Basic',
  Default: 'Default',
  Master: 'Master',
  None: 'None',
  Session: 'Session'
};
Object.freeze(AuthType);

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
    const activeUser = client.getActiveUser();

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

export class Properties extends Headers { }

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

  static execute(options, client, dataOnly = true) {
    const o = assign({
      method: RequestMethod.GET,
      authType: AuthType.Session
    }, options);
    client = client || Client.sharedInstance();

    if (!o.url && isString(o.pathname) && client) {
      o.url = url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: o.pathname
      });
    }

    let prm = new KinveyRequest(o).execute();
    if (dataOnly) {
      prm = prm.then(r => r.data);
    }
    return prm;
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

  /** @returns {Promise} */
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
        if ((response instanceof KinveyResponse) === false) {
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
        if (retry && error instanceof InvalidCredentialsError) {
          const activeUser = this.client.getActiveUser();

          if (isDefined(activeUser)) {
            const socialIdentity = isDefined(activeUser._socialIdentity) ? activeUser._socialIdentity : {};
            const sessionKey = Object.keys(socialIdentity)
              .find(sessionKey => socialIdentity[sessionKey].identity === 'kinveyAuth');
            const oldSession = socialIdentity[sessionKey];

            if (isDefined(oldSession)) {
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
                  client_id: oldSession.client_id,
                  redirect_uri: oldSession.redirect_uri,
                  refresh_token: oldSession.refresh_token
                },
                properties: this.properties,
                timeout: this.timeout
              });
              return request.execute()
                .then(response => response.data)
                .then((session) => {
                  session.identity = oldSession.identity;
                  session.client_id = oldSession.client_id;
                  session.redirect_uri = oldSession.redirect_uri;
                  session.protocol = this.client.micProtocol;
                  session.host = this.client.micHost;
                  return session;
                })
                .then((session) => {
                  const data = {};
                  socialIdentity[session.identity] = session;
                  data._socialIdentity = socialIdentity;

                  const request = new KinveyRequest({
                    method: RequestMethod.POST,
                    authType: AuthType.App,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `/user/${this.client.appKey}/login`
                    }),
                    properties: this.properties,
                    body: data,
                    timeout: this.timeout,
                    client: this.client
                  });
                  return request.execute()
                    .then((response) => response.data)
                    .then((user) => {
                      user._socialIdentity[session.identity] = defaults(user._socialIdentity[session.identity], session);
                      return this.client.setActiveUser(user);
                    });
                })
                .then(() => {
                  return this.execute(rawResponse, false);
                })
                .catch(() => Promise.reject(error));
            }
          }
        }

        return Promise.reject(error);
      });
  }
}
