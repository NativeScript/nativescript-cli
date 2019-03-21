import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import { get as getConfig } from '../kinvey/config';

const NAMESPACE = 'blob';

export default async function removeById(id, options: any = {}) {
  const { apiProtocol, apiHost, appKey } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.DELETE,
    auth: Auth.Default,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${NAMESPACE}/${appKey}/${id}`),
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
