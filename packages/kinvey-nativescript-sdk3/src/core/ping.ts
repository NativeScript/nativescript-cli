import { get as getConfig } from './kinvey/config';
import { formatKinveyUrl } from './http/utils';
import { KinveyRequest, RequestMethod } from './http/request';
import { Auth } from './http/auth';

const APPDATA_NAMESPACE = 'appdata';

export default async function ping(options: any = {}) {
  const { appKey, apiProtocol, apiHost } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.GET,
    auth: Auth.All,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${APPDATA_NAMESPACE}/${appKey}`),
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
