import isString from 'lodash/isString';
import { KinveyError } from '../errors/kinvey';
import { formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyBaasNamespace, KinveyHttpAuth } from '../http';

export interface ForgotUsernameOptions {
  timeout?: number;
}

export async function forgotUsername(email: string, options: ForgotUsernameOptions = {}) {
  if (!email) {
    throw new KinveyError('An email was not provided.');
  }

  if (!isString(email)) {
    throw new KinveyError('The provided email is not a string.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.App,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, '/user-forgot-username'),
    body: { email },
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
