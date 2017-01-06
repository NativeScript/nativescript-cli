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
} from 'common/errors';
import { isDefined } from 'common/utils';

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
    let error;

    if (code === StatusCode.Unauthorized) {
      error = new InsufficientCredentialsError(message, debug, code, kinveyRequestId);
    } else if (code === StatusCode.NotFound) {
      error = new NotFoundError(message, debug, code, kinveyRequestId);
    } else if (code === StatusCode.ServerError) {
      error = new ServerError(message, debug, code, kinveyRequestId);
    } else {
      error = new KinveyError(message, debug, code, kinveyRequestId);
    }

    if (isDefined(name)) {
      error.name = name;
    }

    return error;
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
    let error;

    if (name === 'FeatureUnavailableError') {
      error = new FeatureUnavailableError(message, debug, code, kinveyRequestId);
    } else if (name === 'IncompleteRequestBodyError') {
      error = new IncompleteRequestBodyError(message, debug, code, kinveyRequestId);
    } else if (name === 'InsufficientCredentials') {
      error = new InsufficientCredentialsError(message, debug, code, kinveyRequestId);
    } else if (name === 'InvalidCredentials') {
      error = new InvalidCredentialsError(message, debug, code, kinveyRequestId);
    } else if (name === 'InvalidIdentifierError') {
      error = new InvalidIdentifierError(message, debug, code, kinveyRequestId);
    } else if (name === 'InvalidQuerySyntaxError') {
      error = new InvalidQuerySyntaxError(message, debug, code, kinveyRequestId);
    } else if (name === 'JSONParseError') {
      error = new JSONParseError(message, debug, code, kinveyRequestId);
    } else if (name === 'MissingQueryError') {
      error = new MissingQueryError(message, debug, code, kinveyRequestId);
    } else if (name === 'MissingRequestHeaderError') {
      error = new MissingRequestHeaderError(message, debug, code, kinveyRequestId);
    } else if (name === 'MissingRequestParameterError') {
      error = new MissingRequestParameterError(message, debug, code, kinveyRequestId);
    } else if (name === 'EntityNotFound'
        || name === 'CollectionNotFound'
        || name === 'AppNotFound'
        || name === 'UserNotFound'
        || name === 'BlobNotFound'
        || name === 'DocumentNotFound') {
      error = new NotFoundError(message, debug, code, kinveyRequestId);
    } else if (name === 'ParameterValueOutOfRangeError') {
      error = new ParameterValueOutOfRangeError(message, debug, code, kinveyRequestId);
    } else if (name === 'ServerError') {
      error = new ServerError(message, debug, code, kinveyRequestId);
    } else {
      return super.error;
    }

    if (isDefined(name)) {
      error.name = name;
    }

    return error;
  }
}
