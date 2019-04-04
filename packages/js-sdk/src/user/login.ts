import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import { ActiveUserError } from '../errors/activeUser';
import { KinveyError } from '../errors/kinvey';
import { setSession, formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyBaasNamespace, KinveyHttpAuth } from '../http';
import { getActiveUser } from './getActiveUser';
import { User } from './user';
import { mergeSocialIdentity } from './utils';

export interface LoginOptions {
  timeout?: number;
}

// export async function login(credentials: { username: string, password: string}, options: LoginOptions = {}): Promise<User>
export async function login(username: string | { username?: string, password?: string, _socialIdentity?: any }, password?: string, options: LoginOptions = {}) {
  const activeUser = getActiveUser();
  let credentials: any = { username, password };
  let timeout = options.timeout;

  if (activeUser) {
    throw new ActiveUserError('An active user already exists. Please logout the active user before you login.');
  }

  if (isPlainObject(username)) {
    credentials = username;

    if (isPlainObject(password)) {
      timeout = (password as LoginOptions).timeout;
    }
  }

  if (credentials.username) {
    credentials.username = String(credentials.username).trim();
  }

  if (credentials.password) {
    credentials.password = String(credentials.password).trim();
  }

  if ((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '') && !credentials._socialIdentity) {
    throw new KinveyError('Username and/or password missing. Please provide both a username and password to login.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.App,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
    body: credentials,
    timeout
  });
  const response = await request.execute();
  const session = response.data;

  // Remove sensitive data
  delete session.password;

  // Merge _socialIdentity
  if (credentials._socialIdentity) {
    session._socialIdentity = mergeSocialIdentity(credentials._socialIdentity, session._socialIdentity);
  }

  // Store the active session
  setSession(session);

  // Return the user
  return new User(session);
}
