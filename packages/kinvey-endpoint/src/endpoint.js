import isString from 'lodash/isString';
import { formatKinveyUrl, KinveyRequest, RequestMethod, Auth } from 'kinvey-http';
import { get as getSession } from 'kinvey-session';
import { getConfig } from 'kinvey-app';

const RPC_NAMESPACE = 'rpc';

export async function endpoint(endpoint, args) {
  if (!isString(endpoint)) {
    throw new Error('An endpoint is required and must be a string.');
  }

  const { api, appKey } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      Authorization: Auth.Session(getSession())
    },
    url: formatKinveyUrl(api.protocol, api.host, `/${RPC_NAMESPACE}/${appKey}/custom/${endpoint}`),
    body: args
  });
  const response = await request.execute();
  return response.data;
}
