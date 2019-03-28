import isString from 'lodash/isString';
import { formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyBaasNamespace, KinveyHttpAuth } from './http';
import { KinveyError } from './errors/kinvey';

export interface EndpointOptions {
  timeout?: number;
}

export async function endpoint(endpoint: string, args?: any, options: EndpointOptions = {}) {
  if (!isString(endpoint)) {
    throw new KinveyError('An endpoint is required and must be a string.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.Session,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpoint}`),
    body: args,
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
