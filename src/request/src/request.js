import { KinveyRack } from '../../rack';
import { Client } from '../../client';
import { KinveyError, NoActiveUserError } from '../../errors';
import UrlPattern from 'url-pattern';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import qs from 'qs/dist/qs';
import url from 'url';
import appendQuery from 'append-query';
import assign from 'lodash/assign';
import result from 'lodash/result';
import head from 'lodash/head';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import isEmpty from 'lodash/isEmpty';
import isNumber from 'lodash/isNumber';
import isArray from 'lodash/isArray';
import { isBlank } from '../../utils/lang';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const defaultTimeout = process.env.KINVEY_DEFAULT_TIMEOUT || 30;
const defaultApiVersion = process.env.KINVEY_DEFAULT_API_VERSION || 4;
const customPropertiesMaxBytesAllowed = process.env.KINVEY_MAX_HEADER_BYTES || 2000;

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

/**
 * @private
 * Enum for Request Methods.
 */
const RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
Object.freeze(RequestMethod);
export { RequestMethod };

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

export class Headers {
  constructor(headers) {
    if (headers instanceof Headers) {
      this.headersMap = headers.headersMap;
      return;
    }

    this.headersMap = new Map();

    if (isBlank(headers)) {
      return;
    }

    const headerNames = Object.keys(headers);
    for (const header of headerNames) {
      if (headers.hasOwnProperty(header)) {
        this.set(header, headers[header]);
      }
    }
  }

  /**
   * Returns first header that matches given name.
   */
  get(header) {
    return head(this.getAll(header));
  }

  /**
   * Returns list of header values for a given name.
   */
  getAll(header) {
    if (isString(header)) {
      header = header.toLowerCase();
    }

    const headers = this.headersMap.get(header);
    return isArray(headers) ? headers : [];
  }

  /**
   * Appends a header to existing list of header values for a given header name.
   */
  append(header, value) {
    const list = this.getAll(header);
    list.push(value);
    this.set(header, list);
    return this;
  }

  /**
   * Sets or overrides header value for given name.
   */
  set(header, value) {
    const list = [];

    if (isArray(value)) {
      const pushValue = value.join(',');
      list.push(pushValue);
    } else {
      list.push(value);
    }

    if (!isString(header)) {
      header = String(header);
    }

    this.headersMap.set(header.toLowerCase(), list);
    return this;
  }

  /**
   * Check for existence of header by given name.
   */
  has(header) {
    return this.headersMap.has(header);
  }

  /**
   * Deletes all header values for the given name.
   */
  delete(name) {
    this.headersMap.delete(name);
    return this;
  }

  /**
   * Deletes all header values.
   */
  deleteAll() {
    this.headersMap = new Map();
    return this;
  }

  forEach(fn) {
    this.headersMap.forEach(fn);
    return this;
  }

  toJSON() {
    const serializableHeaders = {};

    this.forEach((values, header) => {
      let list = [];

      forEach(values, val => {
        list = list.concat(val.split(','));
      });

      serializableHeaders[header] = list;
    });

    return serializableHeaders;
  }

  /**
   * Returns a new Headers instance from the given DOMString of Response Headers
   */
  static fromResponseHeaderString(headersString) {
    return headersString.trim()
      .split('\n')
      .map(val => val.split(':'))
      .map(([key, ...parts]) => ([key.trim(), parts.join(':').trim()]))
      .reduce((headers, [key, value]) => !headers.set(key, value) && headers, new Headers());
  }
}

export class Properties {
  constructor(properties = {}) {
    this.addAll(properties);
  }

  get(key) {
    const properties = this.properties || {};

    if (key && properties.hasOwnProperty(key)) {
      return properties[key];
    }

    return undefined;
  }

  set(key, value) {
    if (!key || !value) {
      throw new Error('A key and value must be provided to set a property.');
    }

    if (!isString(key)) {
      key = String(key);
    }

    const properties = this.properties || {};
    properties[key] = value;
    this.properties = properties;
    return this;
  }

  has(key) {
    return !!this.get(key);
  }

  add(property = {}) {
    return this.set(property.name, property.value);
  }

  addAll(properties) {
    if (!isPlainObject(properties)) {
      throw new KinveyError('properties argument must be an object');
    }

    Object.keys(properties).forEach((key) => {
      const value = properties[key];
      this.set(key, value);
    });

    return this;
  }

  remove(key) {
    if (key) {
      const properties = this.properties || {};
      delete properties[key];
      this.properties = properties;
    }

    return this;
  }

  clear() {
    this.properties = {};
    return this;
  }

  toJSON() {
    return this.properties;
  }

  toString() {
    return JSON.stringify(this.properties);
  }
}

export class RequestConfig {
  constructor(options = {}) {
    options = assign({
      method: RequestMethod.GET,
      headers: new Headers(),
      url: undefined,
      body: null,
      timeout: defaultTimeout,
      followRedirect: true,
      noCache: false
    }, options);

    this.method = options.method;
    this.headers = options.headers;
    this.url = options.url;
    this.body = options.body || options.data;
    this.timeout = options.timeout;
    this.followRedirect = options.followRedirect;
    this.noCache = options.noCache;
  }

  get method() {
    return this.configMethod;
  }

  set method(method) {
    if (!isString(method)) {
      method = String(method);
    }

    method = method.toUpperCase();
    switch (method) {
      case RequestMethod.GET:
      case RequestMethod.POST:
      case RequestMethod.PATCH:
      case RequestMethod.PUT:
      case RequestMethod.DELETE:
        this.configMethod = method;
        break;
      default:
        throw new Error('Invalid request method. Only GET, POST, PATCH, PUT, and DELETE are allowed.');
    }
  }

  get headers() {
    const headers = this.configHeaders;

    if (!headers.has('accept')) {
      headers.set('accept', 'application/json; charset=utf-8');
    }

    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json; charset=utf-8');
    }

    return headers;
  }

  set headers(headers) {
    if (!(headers instanceof Headers)) {
      headers = new Headers(headers);
    }

    this.configHeaders = headers;
  }

  get url() {
    // Unless `noCache` is true, add a cache busting query string.
    // This is useful for Android < 4.0 which caches all requests aggressively.
    if (this.noCache === true) {
      return appendQuery(this.configUrl, qs.stringify({
        _: Math.random().toString(36).substr(2)
      }));
    }

    return this.configUrl;
  }

  set url(urlString) {
    this.configUrl = urlString;
  }

  get body() {
    return this.configBody;
  }

  set body(body) {
    this.configBody = body;
  }

  get data() {
    return this.body;
  }

  set data(data) {
    this.body = data;
  }

  get timeout() {
    return this.configTimeout;
  }

  set timeout(timeout) {
    this.configTimeout = isNumber(timeout) ? timeout : defaultTimeout;
  }

  get followRedirect() {
    return this.configFollowRedirect;
  }

  set followRedirect(followRedirect) {
    this.configFollowRedirect = !!followRedirect;
  }

  get noCache() {
    return this.configNoCache;
  }

  set noCache(noCache) {
    this.configNoCache = !!noCache;
  }
}

export class KinveyRequestConfig extends RequestConfig {
  constructor(options = {}) {
    super(options);

    options = assign({
      authType: AuthType.None,
      kinveyQuery: null,
      apiVersion: defaultApiVersion,
      properties: new Properties(),
      skipBL: false,
      trace: false,
      client: new Client()
    }, options);

    this.authType = options.authType;
    this.kinveyQuery = options.kinveyQuery;
    this.apiVersion = options.apiVersion;
    this.properties = options.properties;
    this.client = options.client;
    const headers = this.headers;

    if (!headers.has('X-Kinvey-Api-Version')) {
      headers.set('X-Kinvey-Api-Version', this.apiVersion);
    }

    if (options.skipBL === true) {
      headers.set('X-Kinvey-Skip-Business-Logic', true);
    }

    if (options.trace === true) {
      headers.set('X-Kinvey-Include-Headers-In-Response', 'X-Kinvey-Request-Id');
      headers.set('X-Kinvey-ResponseWrapper', true);
    }

    this.headers = headers;
  }

  get headers() {
    const headers = super.headers;

    if (this.appVersion) {
      headers.set('X-Kinvey-Client-App-Version', this.appVersion);
    }

    if (this.properties && !isEmpty(this.properties)) {
      const customPropertiesHeader = this.properties.toString();
      const customPropertiesByteCount = byteCount(customPropertiesHeader);

      if (customPropertiesByteCount >= customPropertiesMaxBytesAllowed) {
        throw new Error(
          `The custom properties are ${customPropertiesByteCount} bytes.` +
          `It must be less then ${customPropertiesMaxBytesAllowed} bytes.`,
          'Please remove some custom properties.');
      }

      headers.set('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
    }

    if (global.KinveyDevice) {
      headers.set('X-Kinvey-Device-Information', JSON.stringify(global.KinveyDevice.toJSON()));
    }

    if (this.authType) {
      let authInfo;

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

      if (authInfo) {
        let credentials = authInfo.credentials;

        if (authInfo.username) {
          credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
        }

        headers.set('authorization', `${authInfo.scheme} ${credentials}`);
      }
    }

    return headers;
  }

  set headers(headers) {
    super.headers = headers;
  }

  get url() {
    const urlString = super.url;
    const queryString = this.kinveyQuery ? this.kinveyQuery.toQueryString() : {};

    if (isEmpty(queryString)) {
      return urlString;
    }

    return appendQuery(urlString, qs.stringify(queryString));
  }

  set url(urlString) {
    super.url = urlString;

    if (urlString) {
      const pathname = global.escape(url.parse(urlString).pathname);
      const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');
      const { appKey, collection, entityId } = pattern.match(pathname) || {};
      this.appKey = !!appKey ? global.unescape(appKey) : appKey;
      this.collection = !!collection ? global.unescape(collection) : collection;
      this.entityId = !!entityId ? global.unescape(entityId) : entityId;
    } else {
      this.appKey = undefined;
      this.collection = undefined;
      this.entityId = undefined;
    }
  }

  get apiVersion() {
    return this.configApiVersion;
  }

  set apiVersion(apiVersion) {
    this.configApiVersion = isNumber(apiVersion) ? apiVersion : defaultApiVersion;
  }

  get properties() {
    return this.configProperties;
  }

  set properties(properties) {
    if (properties && !(properties instanceof Properties)) {
      properties = new Properties(properties);
    }

    this.configProperties = properties;
  }

  get client() {
    return this.configClient;
  }

  set client(client) {
    if (client) {
      if (!(client instanceof Client)) {
        throw new KinveyError('client must be an instance of the Client class.');
      }

      this.appVersion = client.appVersion;
    }

    this.configClient = client;
  }

  /**
   * Return the app version request property.
   *
   * @return {String} App version
   */
  get appVersion() {
    return this.configAppVersion;
  }

  /**
   * Set the app version request property. The app version can be provided
   * in major.minor.patch format or something specific to your application.
   *
   * @param  {Any} version App version.
   * @return {RequestProperties} The request properties instance.
   */
  set appVersion(appVersion) {
    this.configAppVersion = appVersion;
  }
}

/**
 * @private
 */
export class Request {
  constructor(config = new RequestConfig()) {
    this.config = config;
    this.executing = false;
  }

  get config() {
    return this.requestConfig;
  }

  set config(config) {
    if (config && !(config instanceof RequestConfig)) {
      config = new RequestConfig(result(config, 'toJSON', config));
    }

    this.requestConfig = config;
  }

  get method() {
    return this.config.method;
  }

  set method(method) {
    this.config.method = method;
  }

  get headers() {
    return this.config.headers;
  }

  set headers(headers) {
    this.config.headers = headers;
  }

  get url() {
    return this.config.url;
  }

  set url(urlString) {
    this.config.url = urlString;
  }

  get body() {
    return this.config.body;
  }

  set body(body) {
    this.config.body = body;
  }

  get data() {
    return this.body;
  }

  set data(data) {
    this.body = data;
  }

  isExecuting() {
    return !!this.executing;
  }

  async execute() {
    if (this.isExecuting()) {
      throw new Error('Unable to execute the request. The request is already executing.');
    }

    // Flip the executing flag to true
    this.executing = true;
  }

  toJSON() {
    const headers = {};
    this.headers.forEach((values, header) => {
      headers[header] = values.join(',');
    });

    const json = {
      method: this.method,
      headers: headers,
      url: this.url,
      body: this.body,
      data: this.body
    };

    return json;
  }
}

/**
 * @private
 */
export class KinveyRequest extends Request {
  constructor(config) {
    super(config);
    this.rack = new KinveyRack();
  }

  get config() {
    return super.config;
  }

  set config(config) {
    if (config && !(config instanceof KinveyRequestConfig)) {
      config = new KinveyRequestConfig(result(config, 'toJSON', config));
    }

    super.config = config;
  }

  get kinveyQuery() {
    return this.config.kinveyQuery;
  }

  set kinveyQuery(query) {
    this.config.kinveyQuery = query;
  }

  get appKey() {
    return this.config.appKey;
  }

  get collection() {
    return this.config.collection;
  }

  get entityId() {
    return this.config.entityId;
  }

  get client() {
    return this.config.client;
  }

  set client(client) {
    this.config.client = client;
  }

  toJSON() {
    const json = super.toJSON();
    json.kinveyQuery = this.kinveyQuery;
    return json;
  }
}
