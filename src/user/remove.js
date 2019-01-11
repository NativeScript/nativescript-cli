import isString from 'lodash/isString';
import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import { getActiveUser } from './user';

export default async function remove(id, options = {}) {
  const { apiProtocol, apiHost, appKey } = getConfig();
  const { hard } = options;
  const activeUser = getActiveUser();

  if (!id) {
    throw new KinveyError('An id was not provided.');
  }

  if (!isString(id)) {
    throw new KinveyError('The id provided is not a string.');
  }

  // Remove the user from the backend
  const url = formatKinveyUrl(apiProtocol, apiHost, `/user/${appKey}/${id}`, { hard: hard ? hard === true : undefined });
  const request = new KinveyRequest({
    method: RequestMethod.DELETE,
    auth: Auth.Default,
    url,
    timeout: options.timeout
  });
  const response = await request.execute();

  // Logout the active user if it is the user we removed
  if (activeUser._id === id) {
    await activeUser.logout();
  }

  // Return the response
  return response.data;
}
