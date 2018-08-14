import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import {
  execute,
  formatKinveyBaasUrl,
  KinveyRequest,
  RequestMethod,
  Auth,
  getActiveUser,
  setActiveUser,
  removeActiveUser
} from '../http';
import * as MIC from './mic';

const NAMESPACE = 'user';

export async function signup(data, options = {}) {
  const activeUser = getActiveUser();
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
    setActiveUser(user);
  }

  return user;
}

export async function login(username, password) {
  const activeUser = getActiveUser();
  let credentials = username;

  if (activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you login.');
  }

  if (!isPlainObject(credentials)) {
    credentials = { username, password };
  }

  if (credentials.username && !isString(credentials.username)) {
    throw new Error('Username must be a string.');
  } else {
    credentials.username = credentials.username.trim();
  }

  if (credentials.password && !isString(credentials.password)) {
    throw new Error('Password must be a string.');
  } else {
    credentials.password = credentials.password.trim();
  }

  if ((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '')
    && !credentials._socialIdentity) {
    throw new Error('Username and/or password missing. Please provide both a username and password to login.');
  }

  const url = formatKinveyBaasUrl(`/${NAMESPACE}/appKey/login`);
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.App,
    url,
    body: credentials
  });
  const response = await execute(request);
  const user = response.data;
  setActiveUser(user);
  return user;
}

export async function loginWithMIC(redirectUri, authorizationGrant, options) {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new Error(
      'An active user already exists. Please logout the active user before you login with Mobile Identity Connect.'
    );
  }

  const session = await MIC.login(redirectUri, authorizationGrant, options);
  const socialIdentity = { kinveyAuth: session };
  const credentials = { _socialIdentity: socialIdentity };

  try {
    return await login(credentials);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      await signup(credentials);
      return await login(credentials);
    }

    throw error;
  }
}

export async function logout() {
  const activeUser = getActiveUser();

  // TODO: unregister from live service
  // TODO: clear data store cache

  if (activeUser) {
    const url = formatKinveyBaasUrl(`/${NAMESPACE}/appKey/_logout`);
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url
    });

    try {
      await execute(request);
    } catch (error) {
      // TODO: log error
    }
  }

  removeActiveUser();
  return true;
}

export async function remove(id, options = {}) {
  const { hard = false } = options;
  const activeUser = getActiveUser();

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
  removeActiveUser();
  return response.data;
}

export {
  getActiveUser
};
