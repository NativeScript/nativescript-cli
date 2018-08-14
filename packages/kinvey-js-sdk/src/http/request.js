import { format } from 'url';
import { getConfig } from '../client';
import { Headers, KinveyHeaders } from './headers';

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
export class Request {
  constructor(request) {
    this.headers = new Headers(request.headers);
    this.method = request.method;
    this.url = request.url;
    this.body = request.body;
    this.timeout = request.timeout;
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
    this.headers = new KinveyHeaders(request.headers);
    this.headers.auth = request.auth;
  }
}
