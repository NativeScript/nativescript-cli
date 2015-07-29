import {isDefined} from '../utils';
import isFunction from 'lodash/lang/isFunction';
import isString from 'lodash/lang/isString';
import HttpMethod from '../enums/httpMethod';
import Rack from './rack';
import AuthType from '../enums/authType';
import Auth from './auth';
import url from 'url';
import Kinvey from '../kinvey';
import DataPolicy from '../enums/dataPolicy';
import defaults from 'lodash/object/defaults';
const privateRequestSymbol = Symbol();

class PrivateRequest {
  get auth() {
    return this._auth;
  }

  set auth(auth) {
    switch (auth) {
    case AuthType.All:
      this._auth = Auth.all;
      break;
    case AuthType.App:
      this._auth = Auth.app;
      break;
    case AuthType.Basic:
      this._auth = Auth.basic;
      break;
    case AuthType.Master:
      this._auth = Auth.master;
      break;
    case AuthType.None:
      this._auth = Auth.none;
      break;
    case AuthType.Session:
      this._auth = Auth.session;
      break;
    case AuthType.Default:
      this._auth = Auth.default;
      break;
    default:
      this._auth = auth;
      break;
    }
  }

  get method() {
    return this._method;
  }

  set method(method) {
    if (!isString(method)) {
      throw new Error('Invalid Http Method. It must be a string.');
    }

    // Make the method uppercase
    method = method.toUpperCase();

    switch (method) {
    case HttpMethod.OPTIONS:
    case HttpMethod.GET:
    case HttpMethod.POST:
    case HttpMethod.PATCH:
    case HttpMethod.PUT:
    case HttpMethod.DELETE:
      this._method = method;
      break;
    default:
      throw new Error('Invalid Http Method. OPTIONS, GET, POST, PATCH, PUT, and DELETE are allowed.');
    }
  }

  get url() {
    return url.format({
      protocol: this.protocol,
      hostname: this.hostname,
      pathname: this.path,
      query: this.query,
      hash: this.hash
    });
  }

  get cacheKey() {
    if (!isDefined(this._cacheKey)) {
      this._cacheKey = this.url;
    }

    return this._cacheKey;
  }

  constructor(method = HttpMethod.GET, path = '', query, body, options = {}) {
    options = defaults({}, options, {
      client: Kinvey.toJSON(),
      authType: AuthType.None,
      dataPolicy: DataPolicy.CloudFirst
    });

    // Set request info
    this.headers = {};
    this.method = method;
    this.protocol = options.client.apiProtocol;
    this.hostname = options.client.apiHostname;
    this.path = path;
    this.query = query;
    this.body = body;
    this.auth = options.authType;
    this.dataPolicy = options.dataPolicy;

    // Add default headers
    const headers = {};
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
    headers['X-Kinvey-Api-Version'] = options.client.apiVersion;
    this.addHeaders(headers);

    // Set cache enabled to global setting
    this.cacheEnabled = options.client.cacheEnabled;
  }

  getHeader(header) {
    const keys = Object.keys(this.headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];

      if (key.toLowerCase() === header.toLowerCase()) {
        return this.headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
    const headers = this.headers || {};
    headers[header] = value;
    this.headers = headers;
  }

  addHeaders(headers) {
    const keys = Object.keys(headers);

    keys.forEach((header) => {
      const value = headers[header];
      this.setHeader(header, value);
    });
  }

  removeHeader(header) {
    delete this.headers[header];
  }

  isCacheEnabled() {
    return this.cacheEnabled;
  }

  enableCache() {
    this.cacheEnabled = true;
  }

  disableCache() {
    this.cacheEnabled = false;
  }

  execute() {
    const promise = Promise.resolve();

    return promise.then(() => {
      if (this.isCacheEnabled()) {
        if (this.method === HttpMethod.GET) {
          return this.executeCache();
        }

        const originalMethod = this.method;
        this.method = HttpMethod.DELETE;
        return this.executeCache().then(() => {
          this.method = originalMethod;
        });
      }
    }).then((response) => {
      if (!isDefined(response) || !response.isSuccess() || this.method !== HttpMethod.GET) {
        if (this.dataPolicy === DataPolicy.LocalFirst || this.dataPolicy === DataPolicy.LocalOnly) {
          return this.executeLocal();
        } else if (this.dataPolicy === DataPolicy.CloudFirst || this.dataPolicy === DataPolicy.CloudOnly) {
          return this.executeCloud();
        }
      }

      return response;
    }).then((response) => {
      if (!isDefined(response) || !response.isSuccess() || this.method !== HttpMethod.GET) {
        if (this.dataPolicy === DataPolicy.LocalFirst) {
          return this.executeCloud();
        } else if (this.dataPolicy === DataPolicy.CloudFirst) {
          return response;// this.executeLocal();
        }
      }

      return response;
    }).then((response) => {
      this.response = response;
      return response;
    });
  }

  executeCache() {
    const auth = this.auth;
    const cacheRack = Rack.cacheRack;
    let promise = Promise.resolve();

    return promise.then(() => {
      if (isDefined(auth)) {
        promise = isFunction(auth) ? auth() : Promise.resolve(auth);

        // Add auth info to headers
        return promise.then((authInfo) => {
          if (isDefined(authInfo)) {
            // Format credentials
            let credentials = authInfo.credentials;
            if (isDefined(authInfo.username)) {
              credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
            }

            // Set the header
            this.setHeader('Authorization', `${authInfo.scheme} ${credentials}`);
          }
        });
      }
    }).then(() => {
      return cacheRack.execute(this);
    }).then((response) => {
      this.cacheResponse = response;
      return response;
    });
  }

  executeLocal() {
    const auth = this.auth;
    const databaseRack = Rack.databaseRack;
    let promise = Promise.resolve();

    return promise.then(() => {
      if (isDefined(auth)) {
        promise = isFunction(auth) ? auth() : Promise.resolve(auth);

        // Add auth info to headers
        return promise.then((authInfo) => {
          if (authInfo !== null) {
            // Format credentials
            let credentials = authInfo.credentials;
            if (isDefined(authInfo.username)) {
              credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
            }

            // Set the header
            this.setHeader('Authorization', `${authInfo.scheme} ${credentials}`);
          }
        });
      }
    }).then(() => {
      return databaseRack.execute(this);
    }).then((response) => {
      this.localResponse = response;
      return response;
    });
  }

  executeCloud() {
    const auth = this.auth;
    const networkRack = Rack.networkRack;
    let promise = Promise.resolve();

    return promise.then(() => {
      if (isDefined(auth)) {
        promise = isFunction(auth) ? auth() : Promise.resolve(auth);

        // Add auth info to headers
        return promise.then((authInfo) => {
          if (authInfo !== null) {
            // Format credentials
            let credentials = authInfo.credentials;
            if (isDefined(authInfo.username)) {
              credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
            }

            // Set the header
            this.setHeader('Authorization', `${authInfo.scheme} ${credentials}`);
          }
        });
      }
    }).then(() => {
      return networkRack.execute(this);
    }).then((response) => {
      this.cloudResponse = response;
      return response;
    });
  }

  toJSON() {
    // Create an object representing the request
    const json = {
      headers: this.headers,
      method: this.method,
      url: this.url,
      body: this.body,
      cacheKey: this.cacheKey,
      response: this.response
    };

    // Return the json object
    return json;
  }
}

class Request {
  constructor(method = HttpMethod.GET, path = '', query, body, options = {}) {
    // Create a private request
    this[privateRequestSymbol] = new PrivateRequest(method, path, query, body, options);
  }

  get method() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.method;
  }

  set method(method) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.method = method;
  }

  get protocol() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.protocol;
  }

  set protocol(protocol) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.protocol = protocol;
  }

  get hostname() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.hostname;
  }

  set hostname(hostname) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.hostname = hostname;
  }

  get auth() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.auth;
  }

  set auth(auth) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.auth = auth;
  }

  get path() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.path;
  }

  set path(path) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.path = path;
  }

  get query() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.query;
  }

  set query(query) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.query = query;
  }

  get body() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.body;
  }

  set body(body) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.body = body;
  }

  get dataPolicy() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.dataPolicy;
  }

  set dataPolicy(dataPolicy) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.dataPolicy = dataPolicy;
  }

  get response() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.response;
  }

  get url() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.url;
  }

  getHeader(header) {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.getHeader(header);
  }

  setHeader(header, value) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.setHeader(header, value);
  }

  addHeaders(headers) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.addHeaders(headers);
  }

  removeHeader(header) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.removeHeader(header);
  }

  isCacheEnabled() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.isCacheEnabled();
  }

  enableCache() {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.enableCache();
  }

  disableCache() {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.disableCache();
  }

  execute() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.execute();
  }

  toJSON() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.toJSON();
  }
}

export default Request;
