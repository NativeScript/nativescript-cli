import isString from 'lodash/isString';
import { formatKinveyBaasUrl, KinveyRequest, RequestMethod, Auth } from 'kinvey-http';

const RPC_NAMESPACE = 'rpc';

export async function endpoint(endpoint, args) {
  if (!isString(endpoint)) {
    throw new Error('An endpoint is required and must be a string.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      Authorization: Auth.Session
    },
    url: formatKinveyBaasUrl(`/${RPC_NAMESPACE}/appKey/custom/${endpoint}`),
    body: args
  });
  const response = await request.execute();
  return response.data;
}
