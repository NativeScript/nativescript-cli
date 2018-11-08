import isNumber from 'lodash/isNumber';
import { KinveyError } from 'kinvey-errors';
import { getConfig } from 'kinvey-app';
import { Headers, KinveyHeaders } from './headers';
import { serialize } from './utils';
import { Response } from './response';

let http = async () => {
  throw new Error('You must override the default http function.');
};

export function register(httpAdapter) {
  http = httpAdapter;
}

export const RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

export class Request {
  constructor(request = {}) {
    const { defaultTimeout } = getConfig();
    const {
      headers,
      method,
      url,
      body,
      timeout = defaultTimeout
    } = request;

    this.headers = headers;
    this.method = method;
    this.url = url;
    this.body = body;
    this.timeout = timeout;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = new Headers(headers);
  }

  get timeout() {
    return this._timeout;
  }

  set timeout(timeout) {
    if (!isNumber(timeout) || isNaN(timeout)) {
      throw new KinveyError('Invalid timeout. Timeout must be a number.');
    }

    this._timeout = timeout;
  }

  async execute() {
    // Make http request
    const responseObject = await http({
      headers: this.headers.toObject(),
      method: this.method,
      url: this.url,
      body: serialize(this.headers.contentType, this.body)
    });

    // Create a response
    const response = new Response({
      statusCode: responseObject.statusCode,
      headers: responseObject.headers,
      data: responseObject.data
    });

    // Handle 401
    // const response = await handle401(response);

    if (response.isSuccess()) {
      return response;
    }

    throw response.error;
  }
}

export class KinveyRequest extends Request {
  constructor(request) {
    super(request);
    this.headers = request.headers;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = new KinveyHeaders(headers);
  }
}
