import isNumber from 'lodash/isNumber';
import { get as getConfig } from '../kinvey/config';
import Query from '../query';
import KinveyError from '../errors/kinvey';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import downloadByUrl from './downloadByUrl';

const NAMESPACE = 'blob';

export default async function find(query = new Query(), options = {}) {
  const { apiProtocol, apiHost, appKey } = getConfig();
  const { download = false, tls = true, ttl } = options;
  let queryStringObject = Object.assign({}, { tls: tls === true });

  if (query) {
    if (!(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    queryStringObject = Object.assign({}, queryStringObject, query.toQueryObject());
  }

  if (isNumber(ttl)) {
    queryStringObject.ttl_in_seconds = parseInt(ttl, 10);
  }

  const request = new KinveyRequest({
    method: RequestMethod.GET,
    auth: Auth.Default,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${NAMESPACE}/${appKey}`, queryStringObject),
    timeout: options.timeout
  });
  const response = await request.execute();
  const files = response.data;

  if (download === true) {
    return Promise.all(files.map(file => downloadByUrl(file._downloadURL, options)));
  }

  return files;
}
