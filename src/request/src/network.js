import { Request, RequestMethod, Headers } from './request';
import { KinveyRackManager } from '../../rack';
import { NoResponseError, KinveyError, InvalidCredentialsError, NoActiveUserError } from '../../errors';
import { KinveyResponse } from './response';
import { Client } from '../../client';
import { SocialIdentity } from '../../social';
import { Device, setActiveUser, getIdentitySession, setIdentitySession } from '../../utils';
import UrlPattern from 'url-pattern';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
import qs from 'qs';
import appendQuery from 'append-query';
import assign from 'lodash/assign';
import isNumber from 'lodash/isNumber';
import isEmpty from 'lodash/isEmpty';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const defaultApiVersion = process.env.KINVEY_DEFAULT_API_VERSION || 4;
const customPropertiesMaxBytesAllowed = process.env.KINVEY_MAX_HEADER_BYTES || 2000;

export class NetworkRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.rack = KinveyRackManager.networkRack;
  }

  async execute(rawResponse = false) {
    await super.execute();
    let response = await this.rack.execute(this);
    this.executing = false;

    if (!response) {
      throw new NoResponseError();
    }

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
  }

  cancel() {
    const promise = super.cancel().then(() => this.rack.cancel());
    return promise;
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
    try {
      return Auth.session(client);
    } catch (error) {
      return Auth.basic(client);
    }
  },

  /**
   * Authenticate through App Secret.
   *
   * @returns {Object}
   */
  app(client) {
    if (!client.appKey || !client.appSecret) {
      throw new Error('Missing client appKey and/or appSecret.'
        + ' Use Kinvey.init() to set the appKey and appSecret for the client.');
    }

    return {
      scheme: 'Basic',
      username: client.appKey,
      password: client.appSecret
    };
  },

  /**
   * Authenticate through (1) Master Secret, or (2) App Secret.
   *
   * @returns {Object}
   */
  basic(client) {
    try {
      return Auth.master(client);
    } catch (error) {
      return Auth.app(client);
    }
  },

  /**
   * Authenticate through Master Secret.
   *
   * @returns {Object}
   */
  master(client) {
    if (!client.appKey || !client.masterSecret) {
      throw new Error('Missing client appKey and/or appSecret.'
        + ' Use Kinvey.init() to set the appKey and appSecret for the client.');
    }

    return {
      scheme: 'Basic',
      username: client.appKey,
      password: client.masterSecret
    };
  },

  /**
   * Do not authenticate.
   *
   * @returns {Null}
   */
  none() {
    return null;
  },

  /**
   * Authenticate through user credentials.
   *
   * @returns {Object}
   */
  session(client) {
    const activeUser = client.activeUser;

    if (!activeUser) {
      throw new NoActiveUserError('There is not an active user. Please login a user and retry the request.');
    }

    return {
      scheme: 'Kinvey',
      credentials: activeUser[kmdAttribute].authtoken
    };
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

    for (let i = 0; i < stringLength; i++) {
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

    // Set default options
    options = assign({
      authType: AuthType.None,
      query: null,
      apiVersion: defaultApiVersion,
      properties: new Headers(),
      skipBL: false,
      trace: false,
      client: Client.sharedInstance()
    }, options);

    this.authType = options.authType;
    this.query = options.query;
    this.apiVersion = options.apiVersion;
    this.properties = options.properties;
    this.client = options.client;
    this.skipBL = options.skipBL;
    this.trace = options.trace;
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
      headers.set('X-Kinvey-Api-Version', this.apiVersion);
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

        if (customPropertiesByteCount >= customPropertiesMaxBytesAllowed) {
          throw new Error(
            `The custom properties are ${customPropertiesByteCount} bytes.` +
            `It must be less then ${customPropertiesMaxBytesAllowed} bytes.`,
            'Please remove some custom properties.');
        }

        headers.set('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
      } else {
        headers.remove('X-Kinvey-Custom-Request-Properties');
      }
    } else {
      headers.remove('X-Kinvey-Custom-Request-Properties');
    }

    // Add the X-Kinvey-Device-Information header
    headers.set('X-Kinvey-Device-Information', Device.toString());

    // Add or remove the Authorization header
    if (this.authType) {
      let authInfo;

      // Get the auth info based on the set AuthType
      switch (this.authType) {
        case AuthType.All:
          authInfo = Auth.all(this.client);
          break;
        case AuthType.App:
          authInfo = Auth.app(this.client);
          break;
        case AuthType.Basic:
          authInfo = Auth.basic(this.client);
          break;
        case AuthType.Master:
          authInfo = Auth.master(this.client);
          break;
        case AuthType.None:
          authInfo = Auth.none(this.client);
          break;
        case AuthType.Session:
          authInfo = Auth.session(this.client);
          break;
        default:
          try {
            authInfo = Auth.session(this.client);
          } catch (error) {
            try {
              authInfo = Auth.master(this.client);
            } catch (error2) {
              throw error;
            }
          }
      }

      // Add the auth info to the Authorization header
      if (authInfo) {
        let credentials = authInfo.credentials;

        if (authInfo.username) {
          credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
        }

        headers.set('Authorization', `${authInfo.scheme} ${credentials}`);
      }
    } else {
      headers.remove('Authorization');
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
    const pathname = global.escape(url.parse(urlString).pathname);
    const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');
    const { appKey, collection, entityId } = pattern.match(pathname) || {};
    this.appKey = !!appKey ? global.unescape(appKey) : appKey;
    this.collection = !!collection ? global.unescape(collection) : collection;
    this.entityId = !!entityId ? global.unescape(entityId) : entityId;
  }

  get apiVersion() {
    return this._apiVersion;
  }

  set apiVersion(apiVersion) {
    this._apiVersion = isNumber(apiVersion) ? apiVersion : defaultApiVersion;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties) {
    if (properties && !(properties instanceof Properties)) {
      properties = new Properties(properties);
    }

    this._properties = properties;
  }

  get client() {
    return this._client;
  }

  set client(client) {
    if (client) {
      if (!(client instanceof Client)) {
        throw new KinveyError('client must be an instance of the Client class.');
      }

      this.appVersion = client.appVersion;
    }

    this._client = client;
  }

  async execute(rawResponse) {
    try {
      const response = await super.execute(rawResponse);
      return response;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        // Retrieve the MIC session
        let micSession = getIdentitySession(this.client, SocialIdentity.MobileIdentityConnect);

        if (micSession) {
          // Refresh MIC Auth Token
          const refreshMICRequest = new KinveyRequest({
            method: RequestMethod.POST,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            authType: AuthType.App,
            url: url.format({
              protocol: micSession.protocol || this.client.micProtocol,
              host: micSession.host || this.client.micHost,
              pathname: tokenPathname
            }),
            body: {
              grant_type: 'refresh_token',
              client_id: micSession.client_id,
              redirect_uri: micSession.redirect_uri,
              refresh_token: micSession.refresh_token
            },
            timeout: this.timeout,
            properties: this.properties
          });
          const newMicSession = await refreshMICRequest.execute().then(response => response.data);
          micSession = assign(micSession, newMicSession);

          // Login the user with the new mic session
          const data = {};
          data[socialIdentityAttribute] = {};
          data[socialIdentityAttribute][SocialIdentity.MobileIdentityConnect] = micSession;

          // Login the user
          const loginRequest = new KinveyRequest({
            method: RequestMethod.POST,
            authType: AuthType.App,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `/${usersNamespace}/${this.client.appKey}/login`
            }),
            properties: this.properties,
            body: data,
            timeout: this.timeout,
            client: this.client
          });
          const activeUser = await loginRequest.execute().then(response => response.data);

          // Store the updated active user
          setActiveUser(this.client, activeUser);

          // Store the updated mic session
          setIdentitySession(this.client, SocialIdentity.MobileIdentityConnect, micSession);

          // Execute the original request
          return this.execute(rawResponse);
        }
      }

      throw error;
    }
  }
}
