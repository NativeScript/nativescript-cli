import Promise from 'babybird';
import { HttpMethod, AuthType } from '../enums';
import { Device } from '../utils/device';
import { RequestProperties } from './properties';
import { KinveyRack } from '../rack/rack';
import { Client } from '../client';
import { byteCount } from '../utils/string';
import UrlPattern from 'url-pattern';
import qs from 'qs';
import url from 'url';
import appendQuery from 'append-query';
import assign from 'lodash/assign';
import result from 'lodash/result';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import isEmpty from 'lodash/isEmpty';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

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
      throw new Error('Missing client credentials');
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
      throw new Error('Missing client credentials');
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
    const activeUser = client.user;

    if (!activeUser) {
      throw new Error('There is not an active user.');
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
export class Request {
  constructor(options = {}) {
    options = assign({
      method: HttpMethod.GET,
      headers: {},
      url: '',
      data: null,
      timeout: process.env.KINVEY_DEFAULT_TIMEOUT || 10000,
      followRedirect: true
    }, options);

    this.method = options.method;
    this.url = options.url;
    this.data = options.data || options.body;
    this.timeout = options.timeout;
    this.followRedirect = options.followRedirect;
    this.executing = false;

    const headers = options.headers && isPlainObject(options.headers) ? options.headers : {};

    if (!headers.Accept || !headers.accept) {
      headers.Accept = 'application/json; charset=utf-8';
    }

    this.addHeaders(headers);
  }

  get method() {
    return this._method;
  }

  set method(method) {
    if (!isString(method)) {
      method = String(method);
    }

    method = method.toUpperCase();

    switch (method) {
      case HttpMethod.GET:
      case HttpMethod.POST:
      case HttpMethod.PATCH:
      case HttpMethod.PUT:
      case HttpMethod.DELETE:
        this._method = method;
        break;
      default:
        throw new Error('Invalid Http Method. Only GET, POST, PATCH, PUT, and DELETE are allowed.');
    }
  }

  get url() {
    return appendQuery(this._url, qs.stringify({
      _: Math.random().toString(36).substr(2)
    }));
  }

  set url(urlString) {
    this._url = urlString;
  }

  get body() {
    return this.data;
  }

  set body(body) {
    this.data = body;
  }

  get data() {
    return this._data;
  }

  set data(data) {
    if (data) {
      const contentTypeHeader = this.getHeader('Content-Type');
      if (!contentTypeHeader) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    } else {
      this.removeHeader('Content-Type');
    }

    this._data = data;
  }

  getHeader(name) {
    if (name) {
      if (!isString(name)) {
        name = String(name);
      }

      const headers = this.headers || {};
      const keys = Object.keys(headers);

      for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];

        if (key.toLowerCase() === name.toLowerCase()) {
          return headers[key];
        }
      }
    }

    return undefined;
  }

  setHeader(name, value) {
    if (!name || !value) {
      throw new Error('A name and value must be provided to set a header.');
    }

    if (!isString(name)) {
      name = String(name);
    }

    const headers = this.headers || {};

    if (!isString(value)) {
      headers[name] = JSON.stringify(value);
    } else {
      headers[name] = value;
    }

    this.headers = headers;
  }

  addHeader(header = {}) {
    return this.setHeader(header.name, header.value);
  }

  addHeaders(headers) {
    if (!isPlainObject(headers)) {
      throw new Error('Headers argument must be an object.');
    }

    const names = Object.keys(headers);

    forEach(names, name => {
      const value = headers[name];
      this.setHeader(name, value);
    });
  }

  removeHeader(name) {
    if (name) {
      if (!isString(name)) {
        name = String(name);
      }

      const headers = this.headers || {};
      delete headers[name];
      this.headers = headers;
    }
  }

  clearHeaders() {
    this.headers = {};
  }

  isExecuting() {
    return this.executing === true;
  }

  execute() {
    if (this.executing) {
      return Promise.reject(new Error('Unable to execute the request. The request is already executing.'));
    }

    this.executing = Promise.resolve().then(response => {
      this.executing = false;
      return response;
    }).catch(error => {
      this.executing = false;
      throw error;
    });

    return this.executing;
  }

  toJSON() {
    const json = {
      method: this.method,
      headers: this.headers,
      url: this.url,
      data: this.data,
      followRedirect: this.followRedirect
    };

    return json;
  }
}

/**
 * @private
 */
export class KinveyRequest extends Request {
  constructor(options = {}) {
    super(options);

    options = assign({
      authType: AuthType.None,
      properties: null,
      query: null,
      client: Client.sharedInstance()
    }, options);

    this.rack = new KinveyRack();
    this.authType = options.authType;
    this.properties = options.properties;
    this.query = result(options.query, 'toJSON', options.query);
    this.client = options.client;

    const headers = {};
    headers['X-Kinvey-Api-Version'] = process.env.KINVEY_API_VERSION || 3;
    headers['X-Kinvey-Device-Information'] = JSON.stringify(Device.toJSON());

    if (options.contentType) {
      headers['X-Kinvey-Content-Type'] = options.contentType;
    }

    if (options.skipBL === true) {
      headers['X-Kinvey-Skip-Business-Logic'] = true;
    }

    if (options.trace === true) {
      headers['X-Kinvey-Include-Headers-In-Response'] = 'X-Kinvey-Request-Id';
      headers['X-Kinvey-ResponseWrapper'] = true;
    }

    this.addHeaders(headers);
  }

  set properties(properties) {
    if (properties) {
      if (!(properties instanceof RequestProperties)) {
        properties = new RequestProperties(result(properties, 'toJSON', properties));
      }

      const appVersion = properties.appVersion;

      if (appVersion) {
        this.setHeader('X-Kinvey-Client-App-Version', appVersion);
      } else {
        this.removeHeader('X-Kinvey-Client-App-Version');
      }

      const customProperties = result(properties, 'toJSON', {});
      delete customProperties.appVersion;
      const customPropertiesHeader = JSON.stringify(customProperties);
      const customPropertiesByteCount = byteCount(customPropertiesHeader);
      const customPropertiesMaxBytesAllowed = process.env.KINVEY_MAX_HEADER_BYTES || 2000;

      if (customPropertiesByteCount >= customPropertiesMaxBytesAllowed) {
        throw new Error(
          `The custom properties are ${customPropertiesByteCount} bytes.` +
          `It must be less then ${customPropertiesMaxBytesAllowed} bytes.`,
          'Please remove some custom properties.');
      }

      this.setHeader('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
    }
  }

  get url() {
    const urlString = super.url;
    const queryString = {};

    if (this.query) {
      queryString.query = this.query.filter;

      if (!isEmpty(this.query.fields)) {
        queryString.fields = this.query.fields.join(',');
      }

      if (this.query.limit) {
        queryString.limit = this.query.limit;
      }

      if (this.query.skip > 0) {
        queryString.skip = this.query.skip;
      }

      if (!isEmpty(this.query.sort)) {
        queryString.sort = this.query.sort;
      }
    }

    const keys = Object.keys(queryString);
    forEach(keys, key => {
      queryString[key] = isString(queryString[key]) ? queryString[key] : JSON.stringify(queryString[key]);
    });

    if (isEmpty(queryString)) {
      return urlString;
    }

    return appendQuery(urlString, qs.stringify(queryString));
  }

  set url(urlString) {
    super.url = urlString;

    const pathname = global.escape(url.parse(urlString).pathname);
    const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collectionName)(/)(:entityId)(/)');
    const { appKey, collectionName, entityId } = pattern.match(pathname) || {};
    this.appKey = !!appKey ? global.unescape(appKey) : appKey;
    this.collectionName = !!collectionName ? global.unescape(collectionName) : collectionName;
    this.entityId = !!entityId ? global.unescape(entityId) : entityId;
  }

  get authorizationHeader() {
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

      return {
        name: 'Authorization',
        value: `${authInfo.scheme} ${credentials}`
      };
    }

    return null;
  }

  execute() {
    const authorizationHeader = this.authorizationHeader;

    if (authorizationHeader) {
      this.addHeader(authorizationHeader);
    }

    const promise = super.execute();
    return promise;
  }

  cancel() {
    const promise = super.cancel();
    return promise;
  }

  toJSON() {
    const json = super.toJSON();
    json.query = this.query;
    return json;
  }
}
