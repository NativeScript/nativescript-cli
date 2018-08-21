import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import * as MIC from './mic';
import { clearCache } from '../datastore';
import {
  execute,
  formatKinveyBaasUrl,
  KinveyRequest,
  RequestMethod,
  Auth,
  getSession,
  setSession,
  removeSession
} from '../http';

const NAMESPACE = 'user';

export async function signup(data, options = {}) {
  const activeUser = getSession();
  const { state = true } = options;

  if (state === true && activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you signup.');
  }

  const url = formatKinveyBaasUrl(`/${NAMESPACE}/appKey`);
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.App,
    url,
    body: isEmpty(data) ? null : data
  });
  const response = await execute(request);
  const user = response.data;

  if (state === true) {
    setSession(user);
  }

  return user;
}

export async function login(username, password) {
  const activeUser = getSession();
  let credentials = username;

  if (activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you login.');
  }

  if (!isPlainObject(credentials)) {
    credentials = { username, password };
  }

  if (credentials.username) {
    credentials.username = String(credentials.username).trim();
  }

  if (credentials.password) {
    credentials.password = String(credentials.password).trim();
  }

  if ((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '')
    && !credentials._socialIdentity) {
    throw new Error('Username and/or password missing. Please provide both a username and password to login.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.App,
    url: formatKinveyBaasUrl(`/${NAMESPACE}/appKey/login`),
    body: credentials
  });
  const response = await execute(request);
  const user = response.data;
  setSession(user);
  return user;
}

export async function loginWithMIC(redirectUri, authorizationGrant, options) {
  const activeUser = getSession();

  if (activeUser) {
    throw new Error(
      'An active user already exists. Please logout the active user before you login with Mobile Identity Connect.'
    );
  }

  const session = await MIC.login(redirectUri, authorizationGrant, options);
  const socialIdentity = {};
  socialIdentity[MIC.IDENTITY] = session;
  const credentials = { _socialIdentity: socialIdentity };

  try {
    return await login(credentials);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return await signup(credentials);
    }

    throw error;
  }
}

export async function logout() {
  const activeUser = getSession();

  // TODO: unregister from live service

  if (activeUser) {
    const url = formatKinveyBaasUrl(`/${NAMESPACE}/appKey/_logout`);
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url
    });

    await execute(request);
    removeSession();
    await clearCache();
  }

  return true;
}

export async function remove(id, options = {}) {
  const { hard = false } = options;
  const activeUser = getSession();

  if (!isString(id)) {
    throw new Error('id must be a string.');
  }

  if (!activeUser) {
    throw new Error('Please login to remove the user.');
  }

  const url = formatKinveyBaasUrl(`/user/appKey/${id}`, { hard });
  const request = new KinveyRequest({
    method: RequestMethod.DELETE,
    auth: Auth.Session,
    url
  });
  const response = await execute(request);
  removeSession();
  return response.data;
}

export {
  getSession as getActiveUser
};
