import CoreObject from './object';
import {isDefined} from './utils';
import isFunction from 'lodash/lang/isFunction';
import isString from 'lodash/lang/isString';
import HttpMethod from '../enums/httpMethod';
import Rack from './rack';
import AuthType from '../enums/authType';
import Auth from './auth';
import url from 'url';
import Query from './query';
import Kinvey from '../kinvey';
import DataPolicy from '../enums/dataPolicy';
const privateRequestSymbol = Symbol();

class PrivateRequest extends CoreObject {
  constructor(method = HttpMethod.GET, path = '', query, body) {
    super();

    let kinvey = Kinvey.instance();

    // Set request info
    this.headers = {};
    this.method = method;
    this.protocol = kinvey.apiProtocol;
    this.hostname = kinvey.apiHostname;
    this.path = path;
    this.query = query instanceof Query ? query.toJSON() : query;
    body = body;
    this.auth = AuthType.None;
    this.dataPolicy = DataPolicy.CloudFirst;

    // Add default headers
    let headers = {};
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
    headers['X-Kinvey-Api-Version'] = kinvey.apiVersion;
    this.addHeaders(headers);

    // Set cache enabled to global setting
    this.cacheEnabled = Kinvey.isCacheEnabled();
  }

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
      method = method + '';
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
      this._cacheKey = JSON.stringify(this.url);
    }

    return this._cacheKey;
  }

  getHeader(header) {
    let keys = Object.keys(this.headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];

      if (key.toLowerCase() === header.toLowerCase()) {
        return this.headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
    let headers = this.headers || {};
    header = header.toLowerCase();
    headers[header] = value;
    this.headers = headers;
  }

  addHeaders(headers) {
    let keys = Object.keys(headers);

    keys.forEach((header) => {
      let value = headers[header];
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
    let promise = Promise.resolve();

    return promise.then(() => {
      if (this.isCacheEnabled()) {
        if (this.method === HttpMethod.GET) {
          return this.executeCache();
        }
        else {
          let originalMethod = this.method;
          this.method = HttpMethod.DELETE;
          return this.executeCache().then(() => {
            this.method = originalMethod;
          });
        }
      }
    }).then((response) => {
      if (!isDefined(response) || !response.isSuccess() || this.method !== HttpMethod.GET) {
        if (this.dataPolicy === DataPolicy.LocalFirst || this.dataPolicy === DataPolicy.LocalOnly) {
          return this.executeLocal();
        }
        else if (this.dataPolicy === DataPolicy.CloudFirst || this.dataPolicy === DataPolicy.CloudOnly) {
          return this.executeCloud();
        }
      }

      return response;
    }).then((response) => {
      if (!isDefined(response) || !response.isSuccess() || this.method !== HttpMethod.GET) {
        if (this.dataPolicy === DataPolicy.LocalFirst) {
          return this.executeCloud();
        }
        else if (this.dataPolicy === DataPolicy.CloudFirst) {
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
          if (auth !== null) {
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
          if (auth !== null) {
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
    let json = {
      headers: this.headers,
      method: this.method,
      url: this.url,
      body: this.body,
      data: this.body,
      cacheKey: this.cacheKey,
      response: this.response
    };

    // Return the json object
    return json;
  }
}

class Request extends CoreObject {
  constructor(method = HttpMethod.GET, path = '', query = {}, body = {}) {
    super();

    // Create a private request
    this[privateRequestSymbol] = new PrivateRequest(method, path, query, body);
  }

  get method() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.method;
  }

  set method(method) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.method = method;
  }

  get protocol() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.protocol;
  }

  set protocol(protocol) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.protocol = protocol;
  }

  get hostname() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.hostname;
  }

  set hostname(hostname) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.hostname = hostname;
  }

  get auth() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.auth;
  }

  set auth(Auth) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.auth = Auth;
  }

  get path() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.path;
  }

  set path(path) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.path = path;
  }

  get query() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.query;
  }

  set query(query) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.query = query;
  }

  get body() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.body;
  }

  set body(body) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.body = body;
    privateRequest.data = body;
  }

  get dataPolicy() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.dataPolicy;
  }

  set dataPolicy(dataPolicy) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.dataPolicy = dataPolicy;
  }

  get response() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.response;
  }

  get url() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.url;
  }

  getHeader(header) {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.getHeader(header);
  }

  setHeader(header, value) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.setHeader(header, value);
  }

  addHeaders(headers) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.addHeaders(headers);
  }

  removeHeader(header) {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.removeHeader(header);
  }

  isCacheEnabled() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.isCacheEnabled();
  }

  enableCache() {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.enableCache();
  }

  disableCache() {
    let privateRequest = this[privateRequestSymbol];
    privateRequest.disableCache();
  }

  execute() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.execute();
  }

  toJSON() {
    let privateRequest = this[privateRequestSymbol];
    return privateRequest.toJSON();
  }
}

export default Request;
