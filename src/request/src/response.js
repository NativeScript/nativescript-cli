import Headers from './headers';
import { KinveyError } from '../../errors';
import assign from 'lodash/assign';

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
    const message = data.message || data.description;
    const debug = data.debug;
    const code = this.statusCode;

    return new KinveyError(message, debug, code);
  }

  isSuccess() {
    return (this.statusCode >= 200 && this.statusCode < 300)
      || this.statusCode === StatusCode.RedirectPermanently
      || this.statusCode === StatusCode.NotModified;
  }
}
