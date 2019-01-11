import isString from 'lodash/isString';
import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';

const RPC_NAMESPACE = 'rpc';

export default async function forgotUsername(email, options = {}) {
  const { apiProtocol, apiHost, appKey } = getConfig();

  if (!email) {
    throw new KinveyError('An email was not provided.');
  }

  if (!isString(email)) {
    throw new KinveyError('The provided email is not a string.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.App,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${RPC_NAMESPACE}/${appKey}/user-forgot-username`),
    body: { email },
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
