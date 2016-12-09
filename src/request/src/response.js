import Headers from './headers';
import assign from 'lodash/assign';
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
  ParameterValueOutOfRangeError,
  ServerError
} from '../../errors';

/**
 * @private
 * Enum for Status Codes.
 */
const StatusCode = {
  Ok: 200,
  Created: 201,
  Empty: 204,
  RedirectTemporarily: 301,
  RedirectPermanently: 302,
  NotModified: 304,
  ResumeIncomplete: 308,
  Unauthorized: 401,
  NotFound: 404,
  ServerError: 500
};
Object.freeze(StatusCode);
export { StatusCode };

/**
 * @private
 */
export default class Response {
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
    return this._headers;
  }

  set headers(headers) {
    if (!(headers instanceof Headers)) {
      headers = new Headers(headers);
    }

    this._headers = headers;
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
    const kinveyRequestId = this.headers.get('X-Kinvey-Request-ID');

    if (code === StatusCode.Unauthorized) {
      return new InsufficientCredentialsError(message, debug, code, kinveyRequestId);
    } else if (code === StatusCode.NotFound) {
      return new NotFoundError(message, debug, code, kinveyRequestId);
    } else if (code === StatusCode.ServerError) {
      return new ServerError(message, debug, code, kinveyRequestId);
    }

    return new KinveyError(name, message, debug, code, kinveyRequestId);
  }

  isSuccess() {
    return (this.statusCode >= 200 && this.statusCode < 300)
      || this.statusCode === StatusCode.RedirectPermanently
      || this.statusCode === StatusCode.NotModified;
  }
}

/**
 * @private
 */
export class KinveyResponse extends Response {
  get error() {
    if (this.isSuccess()) {
      return null;
    }

    const data = this.data || {};
    const name = data.name || data.error;
    const message = data.message || data.description;
    const debug = data.debug;
    const code = this.statusCode;
    const kinveyRequestId = this.headers.get('X-Kinvey-Request-ID');

    if (name === 'FeatureUnavailableError') {
      return new FeatureUnavailableError(message, debug, code, kinveyRequestId);
    } else if (name === 'IncompleteRequestBodyError') {
      return new IncompleteRequestBodyError(message, debug, code, kinveyRequestId);
    } else if (name === 'InsufficientCredentials') {
      return new InsufficientCredentialsError(message, debug, code, kinveyRequestId);
    } else if (name === 'InvalidCredentials') {
      return new InvalidCredentialsError(message, debug, code, kinveyRequestId);
    } else if (name === 'InvalidIdentifierError') {
      return new InvalidIdentifierError(message, debug, code, kinveyRequestId);
    } else if (name === 'InvalidQuerySyntaxError') {
      return new InvalidQuerySyntaxError(message, debug, code, kinveyRequestId);
    } else if (name === 'JSONParseError') {
      return new JSONParseError(message, debug, code, kinveyRequestId);
    } else if (name === 'MissingQueryError') {
      return new MissingQueryError(message, debug, code, kinveyRequestId);
    } else if (name === 'MissingRequestHeaderError') {
      return new MissingRequestHeaderError(message, debug, code, kinveyRequestId);
    } else if (name === 'MissingRequestParameterError') {
      return new MissingRequestParameterError(message, debug, code, kinveyRequestId);
    } else if (name === 'EntityNotFound'
        || name === 'CollectionNotFound'
        || name === 'AppNotFound'
        || name === 'UserNotFound'
        || name === 'BlobNotFound'
        || name === 'DocumentNotFound') {
      return new NotFoundError(message, debug, code, kinveyRequestId);
    } else if (name === 'ParameterValueOutOfRangeError') {
      return new ParameterValueOutOfRangeError(message, debug, code, kinveyRequestId);
    } else if (name === 'ServerError') {
      return new ServerError(message, debug, code, kinveyRequestId);
    }

    return super.error;
  }
}
