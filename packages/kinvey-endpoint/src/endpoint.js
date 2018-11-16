import isString from 'lodash/isString';
import { formatKinveyUrl, KinveyRequest, RequestMethod, Auth } from 'kinvey-http';
import { getConfig } from 'kinvey-app';
import { KinveyError } from 'kinvey-errors';

const RPC_NAMESPACE = 'rpc';

export async function endpoint(endpoint, args) {
  if (!isString(endpoint)) {
    throw new KinveyError('An endpoint is required and must be a string.');
  }

  const { api, appKey } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.Session,
    url: formatKinveyUrl(api.protocol, api.host, `/${RPC_NAMESPACE}/${appKey}/custom/${endpoint}`),
    body: args
  });
  const response = await request.execute();
  return response.data;
}
