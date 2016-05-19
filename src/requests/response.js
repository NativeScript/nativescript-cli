import {
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyError,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  NotFoundError,
  ParameterValueOutOfRangeError
} from '../errors';
import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';

/**
 * @provate
 * Enum for Status Codes.
 */
const StatusCode = {
  Ok: 200,
  Created: 201,
  RedirectTemporarily: 301,
  RedirectPermanetly: 302,
  NotFound: 404,
  ServerError: 500
};
Object.freeze(StatusCode);
export { StatusCode };

/**
 * @private
 */
export class Response {
  constructor(options = {}) {
    options = assign({
      statusCode: StatusCode.Ok,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      data: null
    }, options);

    this.statusCode = options.statusCode;
    this.addHeaders(options.headers);
    this.data = options.data;
  }

  get error() {
    if (this.isSuccess()) {
      return null;
    }

    const data = this.data || {};
    const name = data.name || data.error;
    const message = data.message || data.description;
    const debug = data.debug;

    if (name === 'FeatureUnavailableError') {
      return new FeatureUnavailableError(message, debug);
    } else if (name === 'IncompleteRequestBodyError') {
      return new IncompleteRequestBodyError(message, debug);
    } else if (name === 'InsufficientCredentials') {
      return new InsufficientCredentialsError(message, debug);
    } else if (name === 'InvalidCredentials') {
      return new InvalidCredentialsError(message, debug);
    } else if (name === 'InvalidIdentifierError') {
      return new InvalidIdentifierError(message, debug);
    } else if (name === 'InvalidQuerySyntaxError') {
      return new InvalidQuerySyntaxError(message, debug);
    } else if (name === 'JSONParseError') {
      return new JSONParseError(message, debug);
    } else if (name === 'MissingQueryError') {
      return new MissingQueryError(message, debug);
    } else if (name === 'MissingRequestHeaderError') {
      return new MissingRequestHeaderError(message, debug);
    } else if (name === 'MissingRequestParameterError') {
      return new MissingRequestParameterError(message, debug);
    } else if (name === 'EntityNotFound'
        || name === 'CollectionNotFound'
        || name === 'AppNotFound'
        || name === 'UserNotFound'
        || name === 'BlobNotFound'
        || name === 'DocumentNotFound'
        || this.statusCode === 404) {
      return new NotFoundError(message, debug);
    } else if (name === 'ParameterValueOutOfRangeError') {
      return new ParameterValueOutOfRangeError(message, debug);
    }

    return new KinveyError(message, debug);
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

  isSuccess() {
    return (this.statusCode >= 200 && this.statusCode < 300) || this.statusCode === 302;
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      headers: this.headers,
      data: this.data
    };
  }
}
