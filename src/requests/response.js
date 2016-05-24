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
import { Headers } from './request';
import assign from 'lodash/assign';
import result from 'lodash/result';

/**
 * @provate
 * Enum for Status Codes.
 */
const StatusCode = {
  Ok: 200,
  Created: 201,
  Empty: 204,
  RedirectTemporarily: 301,
  RedirectPermanetly: 302,
  NotFound: 404,
  ServerError: 500
};
Object.freeze(StatusCode);
export { StatusCode };

export class ResponseConfig {
  constructor(options = {}) {
    options = assign({
      statusCode: StatusCode.Empty,
      headers: new Headers(),
      data: null
    }, options);

    this.statusCode = options.statusCode;
    this.headers = options.headers;
    this.data = options.data;
  }

  get headers() {
    return this.configHeaders;
  }

  set headers(headers) {
    if (!(headers instanceof Headers)) {
      headers = new Headers(result(headers, 'toJSON', headers));
    }

    this.configHeaders = headers;
  }

  get data() {
    return this.configData;
  }

  set data(data) {
    this.configData = data;
  }
}

export class KinveyResponseConfig extends ResponseConfig {}

/**
 * @private
 */
export class Response {
  constructor(config = new ResponseConfig()) {
    this.config = config;
  }

  get config() {
    return this.responseConfig;
  }

  set config(config) {
    if (config && !(config instanceof ResponseConfig)) {
      config = new ResponseConfig(config);
    }

    this.responseConfig = config;
  }

  get statusCode() {
    return this.config.statusCode;
  }

  set statusCode(statusCode) {
    this.config.statusCode = statusCode;
  }

  get headers() {
    return this.config.headers;
  }

  set headers(headers) {
    this.config.headers = headers;
  }

  get data() {
    return this.config.data;
  }

  set data(data) {
    this.config.data = data;
  }

  get error() {
    if (this.isSuccess()) {
      return null;
    }

    return new Error();
  }

  isSuccess() {
    return (this.statusCode >= 200 && this.statusCode < 300) || this.statusCode === 302;
  }
}

export class KinveyResponse extends Response {
  get config() {
    return super.config;
  }

  set config(config) {
    if (config && !(config instanceof KinveyResponseConfig)) {
      config = new KinveyResponseConfig(config);
    }

    super.config = config;
  }

  get error() {
    if (this.isSuccess()) {
      return null;
    }

    const data = this.data || {};
    const name = data.name || data.error;
    const message = data.message || data.description;
    const debug = data.debug;
    const code = this.statusCode;

    if (name === 'FeatureUnavailableError') {
      return new FeatureUnavailableError(message, debug, code);
    } else if (name === 'IncompleteRequestBodyError') {
      return new IncompleteRequestBodyError(message, debug, code);
    } else if (name === 'InsufficientCredentials') {
      return new InsufficientCredentialsError(message, debug, code);
    } else if (name === 'InvalidCredentials') {
      return new InvalidCredentialsError(message, debug, code);
    } else if (name === 'InvalidIdentifierError') {
      return new InvalidIdentifierError(message, debug, code);
    } else if (name === 'InvalidQuerySyntaxError') {
      return new InvalidQuerySyntaxError(message, debug, code);
    } else if (name === 'JSONParseError') {
      return new JSONParseError(message, debug, code);
    } else if (name === 'MissingQueryError') {
      return new MissingQueryError(message, debug, code);
    } else if (name === 'MissingRequestHeaderError') {
      return new MissingRequestHeaderError(message, debug, code);
    } else if (name === 'MissingRequestParameterError') {
      return new MissingRequestParameterError(message, debug, code);
    } else if (name === 'EntityNotFound'
        || name === 'CollectionNotFound'
        || name === 'AppNotFound'
        || name === 'UserNotFound'
        || name === 'BlobNotFound'
        || name === 'DocumentNotFound'
        || code === 404) {
      return new NotFoundError(message, debug, code);
    } else if (name === 'ParameterValueOutOfRangeError') {
      return new ParameterValueOutOfRangeError(message, debug, code);
    }

    return new KinveyError(message, debug, code);
  }
}
