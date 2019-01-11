import { get as getConfig } from './kinvey/config';
import { formatKinveyUrl } from './http/utils';
import { KinveyRequest, RequestMethod } from './http/request';
import { Auth } from './http/auth';

const APPDATA_NAMESPACE = 'appdata';

/**
 * Pings the Kinvey API service. This can be used to check if you have configured the SDK correctly.
 *
 * @returns {Promise<Object>} The response from the ping request.
 *
 * @example
 * var promise = Kinvey.ping()
 *  .then(function(response) {
 *     console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
 *  })
 *  .catch(function(error) {
 *    console.log('Kinvey Ping Failed. Response: ' + error.description);
 *  });
 */
export default async function ping(options = {}) {
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
