import isString from 'lodash/isString';
import { KinveyError } from '../errors/kinvey';
import { formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyBaasNamespace, KinveyHttpAuth } from '../http';

export interface VerifyEmailOptions {
  timeout?: number;
}

export async function verifyEmail(username: string, options: VerifyEmailOptions = {}) {
  if (!username) {
    throw new KinveyError('A username was not provided.');
  }

  if (!isString(username)) {
    throw new KinveyError('The provided username is not a string.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.App,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/${username}/user-email-verification-initiate`),
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
