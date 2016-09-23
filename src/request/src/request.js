import { NoResponseError, KinveyError } from '../../errors';
import Response from './response';
import Headers from './headers';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import qs from 'qs';
import appendQuery from 'append-query';
import assign from 'lodash/assign';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
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
export default class Request {
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
      return appendQuery(this._url, qs.stringify({
        _: Math.random().toString(36).substr(2)
      }));
    }

    return this._url;
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
    if (!this.rack) {
      throw new KinveyError('Unable to execute the request. Please provide a rack to execute the request.');
    }

    let response = await this.rack.execute(this.toPlainObject());

    if (!response) {
      throw new NoResponseError();
    }

    if (!(response instanceof Response)) {
      response = new Response({
        statusCode: response.statusCode,
        headers: response.headers,
        data: response.data
      });
    }

    return response;
  }

  toPlainObject() {
    return {
      method: this.method,
      headers: this.headers.toPlainObject(),
      url: this.url,
      body: this.body,
      timeout: this.timeout,
      followRedirect: this.followRedirect
    };
  }
}

