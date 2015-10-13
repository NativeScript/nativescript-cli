import isDefined from '../utils/isDefined';
import isFunction from 'lodash/lang/isFunction';
import isString from 'lodash/lang/isString';
import HttpMethod from './enums/httpMethod';
import Rack from '../rack/rack';
import ResponseType from './enums/responseType';
import Query from './query';
import url from 'url';
import Client from './client';
import Auth from './auth';
import DataPolicy from './enums/dataPolicy';
import { KinveyError } from './errors';
import RequestProperties from './requestProperties';
import assign from 'lodash/object/assign';
import merge from 'lodash/object/merge';
import result from 'lodash/object/result';
import clone from 'lodash/lang/clone';
import { byteCount } from '../utils/string';
const privateRequestSymbol = Symbol();
const customRequestPropertiesMaxBytes = 2000;

class PrivateRequest {
  constructor(method = HttpMethod.GET, path = '', query, body, options = {}) {
    options = assign({
      auth: Auth.none,
      client: Client.sharedInstance(),
      dataPolicy: DataPolicy.CloudFirst,
      responseType: ResponseType.Text
    }, options);

    let client = options.client;

    // Validate options
    if (!(client instanceof Client)) {
      client = new Client(result(client, 'toJSON', client));
    }

    // Validate query
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    // Set request info
    this.method = method;
    this.headers = {};
    this.requestProperties = options.requestProperties;
    this.protocol = options.client.apiProtocol;
    this.host = options.client.apiHost;
    this.path = path;
    this.query = query;
    this.flags = options.flags;
    this.body = body;
    this.responseType = options.responseType;
    this.client = options.client;
    this.auth = options.auth;
    this.dataPolicy = options.dataPolicy;
    this.executing = false;

    // Add default headers
    const headers = {};
    headers.Accept = 'application/json';
    headers['X-Kinvey-Api-Version'] = process.env.KINVEY_API_VERSION;
    headers['X-Kinvey-Device-Information'] = {};

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

  get method() {
    return this._method;
  }

  set method(method) {
    if (!isString(method)) {
      method = String(method);
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

  get requestProperties() {
    return this._requestProperties;
  }

  set requestProperties(requestProperties) {
    if (!(requestProperties instanceof RequestProperties)) {
      requestProperties = new RequestProperties(result(requestProperties, 'toJSON', requestProperties));
    }

    const appVersion = requestProperties.getAppVersion();

    if (appVersion) {
      this.setHeader('X-Kinvey-Client-App-Version', appVersion);
    } else {
      this.removeHeader('X-Kinvey-Client-App-Version');
    }

    const customRequestProperties = result(requestProperties, 'toJSON', {});
    delete customRequestProperties.appVersion;
    const customRequestPropertiesHeader = JSON.stringify(requestProperties.toJSON());
    const customRequestPropertiesByteCount = byteCount(customRequestPropertiesHeader);

    if (customRequestPropertiesByteCount >= customRequestPropertiesMaxBytes) {
      throw new KinveyError(`The custom request properties are ${customRequestPropertiesByteCount}. It must be less then ${customRequestPropertiesMaxBytes} bytes.`, 'Please remove some custom request properties.');
    }

    this.setHeader('X-Kinvey-Custom-Request-Properties', customRequestPropertiesHeader);
    this._requestProperties = requestProperties;
  }

  get url() {
    return url.format({
      protocol: this.protocol,
      host: this.host,
      pathname: this.path,
      query: merge({}, this.flags, result(this.query, 'toJSON', {})),
      hash: this.hash
    });
  }

  get body() {
    return this._body;
  }

  set body(body) {
    if (body) {
      const contentTypeHeader = this.getHeader('Content-Type');

      if (!contentTypeHeader) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    } else {
      this.removeHeader('Content-Type');
    }

    this._body = body;
  }

  get responseType() {
    return this._responseType;
  }

  set responseType(type) {
    type = type || ResponseType.DOMString;
    let responseType;

    switch (type) {
    case ResponseType.Blob:
      try {
        responseType = new global.Blob() && 'blob';
      } catch (e) {
        responseType = 'arraybuffer';
      }

      break;
    case ResponseType.Document:
      responseType = 'document';
      break;
    case ResponseType.JSON:
      responseType = 'json';
      break;
    default:
      responseType = '';
    }

    this._responseType = responseType;
  }

  getHeader(header) {
    if (!isString(header)) {
      header = String(header);
    }

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
    if (!isString(header)) {
      header = String(header);
    }

    if (!isString(value)) {
      value = String(value);
    }

    const headers = this.headers;
    headers[header.toLowerCase()] = value;
    this.headers = headers;
  }

  addHeaders(headers = {}) {
    const keys = Object.keys(headers);

    keys.forEach((header) => {
      const value = headers[header];
      this.setHeader(header, value);
    });
  }

  removeHeader(header) {
    delete this.headers[header.toLowerCase()];
  }

  execute() {
    if (this.executing) {
      return Promise.reject(new KinveyError('The request is already executing.'));
    }

    const dataPolicy = this.dataPolicy;
    const method = this.method;
    let promise;

    // Switch the executing flag
    this.executing = true;

    if (dataPolicy === DataPolicy.LocalOnly) {
      promise = this.executeLocal();
    } else if (dataPolicy === DataPolicy.LocalFirst) {
      promise = this.executeLocal().then((response) => {
        if (response && response.isSuccess()) {
          if (this.method !== HttpMethod.GET) {
            const privateRequest = new PrivateRequest(method, this.path, this.query, response.data, {
              auth: this.auth,
              client: this.client,
              dataPolicy: DataPolicy.CloudOnly
            });
            return privateRequest.execute().then(() => {
              return response;
            });
          }
        } else {
          if (this.method === HttpMethod.GET) {
            const privateRequest = new PrivateRequest(method, this.path, this.query, response.data, {
              auth: this.auth,
              client: this.client,
              dataPolicy: DataPolicy.CloudFirst
            });
            return privateRequest.execute();
          }
        }

        return response;
      });
    } else if (dataPolicy === DataPolicy.CloudOnly) {
      promise = this.executeCloud();
    } else if (dataPolicy === DataPolicy.CloudFirst) {
      promise = this.executeCloud().then((response) => {
        if (response && response.isSuccess()) {
          const privateRequest = new PrivateRequest(method, this.path, this.query, response.data, {
            auth: this.auth,
            client: this.client,
            dataPolicy: DataPolicy.LocalOnly
          });

          if (method === HttpMethod.GET) {
            privateRequest.method = HttpMethod.PUT;
          }

          return privateRequest.execute().then(() => {
            return response;
          });
        } else if (this.method === HttpMethod.GET) {
          const privateRequest = new PrivateRequest(method, this.path, this.query, response.data, {
            auth: this.auth,
            client: this.client,
            dataPolicy: DataPolicy.LocalOnly
          });
          return privateRequest.execute();
        }

        return response;
      });
    }

    return promise.then((response) => {
      // Save the response
      this.response = response;

      // Switch the executing flag
      this.executing = false;

      // Return the response
      return response;
    }).catch((err) => {
      // Switch the executing flag
      this.executing = false;

      // Throw the err to allow it to
      // be caught later in the promise chain
      throw err;
    });
  }

  executeLocal() {
    const rack = Rack.cacheRack;
    return rack.execute(this);
  }

  executeCloud() {
    const auth = this.auth;
    const rack = Rack.networkRack;
    let promise = Promise.resolve();

    return promise.then(() => {
      if (isDefined(auth)) {
        promise = isFunction(auth) ? auth(this.client) : Promise.resolve(auth);

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
      return rack.execute(this);
    });
  }

  cancel() {
    // TODO
    throw new KinveyError('Method not supported');
  }

  toJSON() {
    // Create an object representing the request
    const json = {
      method: this.method,
      headers: this.headers,
      requestProperties: result(this.requestProperties, 'toJSON', null),
      url: this.url,
      path: this.path,
      query: result(this.query, 'toJSON', null),
      flags: this.flags,
      body: this._body,
      responseType: this.responseType,
      dataPolicy: this.dataPolicy,
      client: result(this.client, 'toJSON', null)
    };

    // Return the json object
    return clone(json, true);
  }
}

class Request {
  constructor(method = HttpMethod.GET, path = '', query, body, options = {}) {
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

  get host() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.host;
  }

  set host(host) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.host = host;
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

  get flags() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.flags;
  }

  set flags(flags) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.flags = flags;
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

  get responseType() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.responseType;
  }

  set responseType(type) {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.responseType = type;
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

  execute() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.execute();
  }

  cancel() {
    const privateRequest = this[privateRequestSymbol];
    privateRequest.cancel();
  }

  toJSON() {
    const privateRequest = this[privateRequestSymbol];
    return privateRequest.toJSON();
  }
}

export default Request;
