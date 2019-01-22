import isEmpty from 'lodash/isEmpty';
import { get as getConfig } from '../kinvey/config';
import ActiveUserError from '../errors/activeUser';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import { set as setSession } from '../session';
import getActiveUser from './getActiveUser';
import User from './user';

const USER_NAMESPACE = 'user';

export default async function signup(data, options = {}) {
  const { apiProtocol, apiHost, appKey } = getConfig();
  const activeUser = getActiveUser();
  const { state = true } = options;

  if (state === true && activeUser) {
    throw new ActiveUserError('An active user already exists. Please logout the active user before you signup.');
  }

  const url = formatKinveyUrl(apiProtocol, apiHost, `/${USER_NAMESPACE}/${appKey}`);
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.App,
    url,
    timeout: options.timeout
  });

  if (data instanceof User) {
    request.body = isEmpty(data.data) ? null : data.data;
  } else {
    request.body = isEmpty(data) ? null : data;
  }

  const response = await request.execute();
  const session = response.data;

  if (state === true) {
    setSession(session);
  }

  return new User(session);
}
