import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import qs from 'qs';
import appendQuery from 'append-query';
import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isPlainObject from 'lodash/isPlainObject';
const defaultTimeout = process.env.KINVEY_DEFAULT_TIMEOUT || 30;

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

/**
 * @private
 */
export class Headers {
  constructor(headers = {}) {
    this.headers = {};
    this.addAll(headers);
  }

  get(name) {
    if (name) {
      if (!isString(name)) {
        name = String(name);
      }

      const headers = this.headers;
      return headers[name.toLowerCase()];
    }

    return undefined;
  }

  set(name, value) {
    if (name === undefined || name === null || value === undefined || value === null) {
      throw new Error('A name and value must be provided to set a header.');
    }

    if (!isString(name)) {
      name = String(name);
    }

    const headers = this.headers;
    name = name.toLowerCase();

    if (!isString(value)) {
      headers[name] = JSON.stringify(value);
    } else {
      headers[name] = value;
    }

    this.headers = headers;
    return this;
  }

  has(name) {
    return !!this.get(name);
  }

  add(header = {}) {
    return this.set(header.name, header.value);
  }

  addAll(headers) {
    if (!isPlainObject(headers)) {
      throw new Error('Headers argument must be an object.');
    }

    const names = Object.keys(headers);
    forEach(names, name => {
      const value = headers[name];
      this.set(name, value);
    });
    return this;
  }

  remove(name) {
    if (name) {
      if (!isString(name)) {
        name = String(name);
      }

      const headers = this.headers;
      delete headers[name.toLowerCase()];
      this.headers = headers;
    }

    return this;
  }

  clear() {
    this.headers = {};
    return this;
  }

  toJSON() {
    return this.headers;
  }

  toString() {
    return JSON.stringify(this.headers);
  }
}

/**
 * @private
 */
export class Request {
  constructor(options = {}) {
    options = assign({
      method: RequestMethod.GET,
      headers: new Headers(),
      url: '',
      body: null,
      timeout: defaultTimeout,
      followRedirect: true,
      cache: false
    }, options);

    this.method = options.method;
    this.headers = options.headers;
    this.url = options.url;
    this.body = options.body || options.data;
    this.timeout = options.timeout;
    this.followRedirect = options.followRedirect;
    this.cache = options.cache;
    this.executing = false;
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
      case RequestMethod.GET:
      case RequestMethod.POST:
      case RequestMethod.PATCH:
      case RequestMethod.PUT:
      case RequestMethod.DELETE:
        this._method = method;
        break;
      default:
        throw new Error('Invalid request method. Only GET, POST, PATCH, PUT, and DELETE are allowed.');
    }
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    if (!(headers instanceof Headers)) {
      headers = new Headers(headers);
    }

    this._headers = headers;
  }

  get url() {
    // If `cache` is true, add a cache busting query string.
    // This is useful for Android < 4.0 which caches all requests aggressively.
    if (this.cache === true) {
      return appendQuery(this.configUrl, qs.stringify({
        _: Math.random().toString(36).substr(2)
      }));
    }

    return this.configUrl;
  }

  set url(urlString) {
    this._url = urlString;
  }

  get data() {
    return this.body;
  }

  set data(data) {
    this.body = data;
  }

  get timeout() {
    return this._timeout;
  }

  set timeout(timeout) {
    this._timeout = isNumber(timeout) ? timeout : defaultTimeout;
  }

  get followRedirect() {
    return this._followRedirect;
  }

  set followRedirect(followRedirect) {
    this._followRedirect = !!followRedirect;
  }

  get cache() {
    return this._cache;
  }

  set cache(cache) {
    this._cache = !!cache;
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
}

