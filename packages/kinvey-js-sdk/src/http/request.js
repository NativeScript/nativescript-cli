import Headers from './headers';

/**
 * @private
 */
export const RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

/**
 * @private
 */
export default class Request {
  constructor(request) {
    this.headers = new Headers(request.headers);
    this.method = request.method;
    this.url = request.url;
    this.body = request.body;
    this.timeout = request.timeout;
  }
}
