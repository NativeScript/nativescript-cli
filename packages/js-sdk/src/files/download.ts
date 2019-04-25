import isNumber from 'lodash/isNumber';
import { downloadByUrl } from './downloadByUrl';
import { KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, formatKinveyBaasUrl, KinveyBaasNamespace } from '../http';

export async function download(id?: string, options: any = {}) {
  const { stream = false, tls = true, ttl } = options;
  const queryStringObject: any = Object.assign({}, { tls: tls === true });

  if (isNumber(ttl)) {
    queryStringObject.ttl_in_seconds = ttl;
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.GET,
    auth: KinveyHttpAuth.SessionOrMaster,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Blob, `/${id}`, queryStringObject),
    timeout: options.timeout
  });
  const response = await request.execute();
  const file = response.data;

  if (stream) {
    return file;
  }

  return downloadByUrl(file._downloadURL, options);
}
