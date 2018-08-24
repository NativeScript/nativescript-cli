import { Headers } from './headers';

/**
 * @private
 */
export default class Response {
  constructor(response) {
    this.statusCode = response.statusCode;
    this.headers = new Headers(response.headers);
    this.data = response.data;
  }

  get error() {
    if (!this.isSuccess()) {
      const name = this.data.error || this.data.name;
      const message = this.data.message || this.data.description;
      const code = this.data.code;
      // const debug = responseData.debug;
      // const code = response.statusCode;
      // const kinveyRequestId = responseHeaders.get('X-Kinvey-Request-ID');

      if (code === 'ESOCKETTIMEDOUT' || code === 'ETIMEDOUT') {
        return new Error('The network request timed out.');
      } else if (code === 'ENOENT') {
        return new Error('You do not have a network connection.');
      }

      const error = new Error(message);
      error.code = this.statusCode;

      if (name) {
        error.name = name;
      }

      return error;
    }

    return null;
  }

  isSuccess() {
    return (this.statusCode >= 200 && this.statusCode < 300)
      || this.statusCode === 301
      || this.statusCode === 302
      || this.statusCode === 304
      || this.statusCode === 307
      || this.statusCode === 308;
  }
}
