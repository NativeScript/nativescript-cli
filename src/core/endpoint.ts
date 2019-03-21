import isString from 'lodash/isString';
import { formatKinveyUrl } from './http/utils';
import { KinveyRequest, RequestMethod } from './http/request';
import { Auth } from './http/auth';
import { get as getConfig } from './kinvey/config';
import KinveyError from './errors/kinvey';

const RPC_NAMESPACE = 'rpc';

export default async function endpoint(endpoint, args, options: any = {}) {
  if (!isString(endpoint)) {
    throw new KinveyError('An endpoint is required and must be a string.');
  }

  const { apiProtocol, apiHost, appKey } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.Session,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${RPC_NAMESPACE}/${appKey}/custom/${endpoint}`),
    body: args,
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
