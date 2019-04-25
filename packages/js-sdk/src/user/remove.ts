import isString from 'lodash/isString';
import { KinveyError } from '../errors/kinvey';
import { formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyBaasNamespace, KinveyHttpAuth } from '../http';
import { getActiveUser } from './getActiveUser';

export async function remove(id: string, options: { timeout?: number, hard?: boolean } = {}) {
  const { hard } = options;
  const activeUser = getActiveUser();

  if (!id) {
    throw new KinveyError('An id was not provided.');
  }

  if (!isString(id)) {
    throw new KinveyError('The id provided is not a string.');
  }

  // Remove the user from the backend
  const url = formatKinveyBaasUrl(KinveyBaasNamespace.User, `/${id}`, { hard: hard ? hard === true : undefined });
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.DELETE,
    auth: KinveyHttpAuth.SessionOrMaster,
    url,
    timeout: options.timeout
  });
  const response = await request.execute();

  // Logout the active user if it is the user we removed
  if (activeUser && activeUser._id === id) {
    await activeUser.logout();
  }

  // Return the response
  return response.data;
}
