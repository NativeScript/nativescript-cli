import isNumber from 'lodash/isNumber';
import { Query } from '../query';
import { KinveyError } from '../errors/kinvey';
import { KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, formatKinveyBaasUrl, KinveyBaasNamespace } from '../http';
import { downloadByUrl } from './downloadByUrl';

export async function find(query = new Query(), options: any = {}) {
  const { download = false, tls = true, ttl } = options;
  let queryStringObject: any = Object.assign({}, { tls: tls === true });

  if (query) {
    if (!(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    queryStringObject = Object.assign({}, queryStringObject, query.toQueryObject());
  }

  if (isNumber(ttl)) {
    queryStringObject.ttl_in_seconds = ttl;
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.GET,
    auth: KinveyHttpAuth.SessionOrMaster,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Blob, '/', queryStringObject),
    timeout: options.timeout
  });
  const response = await request.execute();
  const files = response.data;

  if (download === true) {
    return Promise.all(files.map((file: { _downloadURL: string; }) => downloadByUrl(file._downloadURL, options)));
  }

  return files;
}
