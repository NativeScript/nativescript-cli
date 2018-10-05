import { format } from 'url';
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
  constructor(request) {
    this.headers = request.headers;
    this.method = request.method;
    this.url = request.url;
    this.body = request.body;
    this.timeout = request.timeout;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = new Headers(headers);
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

function getKinveyUrl(protocol, host, pathname, query) {
  const { appKey } = getConfig();
  return format({
    protocol,
    host,
    pathname: pathname.replace(/appKey/gi, appKey),
    query
  });
}

export function formatKinveyAuthUrl(pathname, query) {
  const { api } = getConfig();
  return getKinveyUrl(api.auth.protocol, api.auth.host, pathname, query);
}

export function formatKinveyBaasUrl(pathname, query) {
  const { api } = getConfig();
  return getKinveyUrl(api.baas.protocol, api.baas.host, pathname, query);
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
