import isString from 'lodash/isString';
import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';

const RPC_NAMESPACE = 'rpc';

export default async function verifyEmail(username, options = {}) {
  const { apiProtocol, apiHost, appKey } = getConfig();

  if (!username) {
    throw new KinveyError('A username was not provided.');
  }

  if (!isString(username)) {
    throw new KinveyError('The provided username is not a string.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.App,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${RPC_NAMESPACE}/${appKey}/${username}/user-email-verification-initiate`),
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
