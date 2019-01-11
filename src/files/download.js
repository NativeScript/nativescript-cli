import isNumber from 'lodash/isNumber';
import { get as getConfig } from '../kinvey/config';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import downloadByUrl from './downloadByUrl';

const NAMESPACE = 'blob';

export default async function download(id, options = {}) {
  const { apiProtocol, apiHost, appKey } = getConfig();
  const { stream = false, tls = true, ttl } = options;
  const queryStringObject = Object.assign({}, { tls: tls === true });

  if (isNumber(ttl)) {
    queryStringObject.ttl_in_seconds = parseInt(ttl, 10);
  }

  const request = new KinveyRequest({
    method: RequestMethod.GET,
    auth: Auth.Default,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${NAMESPACE}/${appKey}/${id}`, queryStringObject),
    timeout: options.timeout
  });
  const response = await request.execute();
  const file = response.data;

  if (stream) {
    return file;
  }

  return downloadByUrl(file._downloadURL, options);
}
