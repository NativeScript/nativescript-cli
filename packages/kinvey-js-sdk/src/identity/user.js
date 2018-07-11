import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import { getConfig } from '../client';
import {
  execute,
  getKinveySessionAuthorizationHeader,
  formatKinveyBaasUrl,
  Request,
  RequestMethod,
  KinveyHeaders,
  getKinveyAppAuthorizationHeader
} from '../http';
import Kmd from '../kmd';
import * as MIC from './mic';

let store = new Map();
export function use(customStore) {
  if (customStore) {
    store = customStore;
  }
}

export function getActiveUser() {
  const { appKey } = getConfig();
  return store.get(appKey);
}

function setActiveUser(user) {
  const { appKey } = getConfig();

  if (!user) {
    throw new Error('Please provide a valid user to set as the active user.');
  }

  store.set(appKey, user);
  return user;
}

function removeActiveUser() {
  const { appKey } = getConfig();

  if (isFunction(store.delete)) {
    store.delete(appKey);
  } else {
    store.remove(appKey);
  }

  return null;
}

export async function signup(data, options = {}) {
  const activeUser = getActiveUser();
  const { state = true } = options;

  if (state === true && activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you signup.');
  }

  const url = formatKinveyBaasUrl('/user/appKey');
  const headers = new KinveyHeaders();
  const authorizationHeader = getKinveyAppAuthorizationHeader();
  headers.set(authorizationHeader.name, authorizationHeader.value);
  const request = new Request({
    method: RequestMethod.POST,
    headers,
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

  if ((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '') && !credentials._socialIdentity) {
    throw new Error('Username and/or password missing. Please provide both a username and password to login.');
  }

  const url = formatKinveyBaasUrl('/user/appKey/login');
  const headers = new KinveyHeaders();
  const authorizationHeader = getKinveyAppAuthorizationHeader();
  headers.set(authorizationHeader.name, authorizationHeader.value);
  const request = new Request({
    method: RequestMethod.POST,
    headers,
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
    throw new Error('An active user already exists. Please logout the active user before you login with Mobile Identity Connect.');
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
    const url = formatKinveyBaasUrl('/user/appKey/_logout');
    const headers = new KinveyHeaders();
    const kmd = new Kmd(activeUser._kmd);
    const authorizationHeader = getKinveySessionAuthorizationHeader(kmd.authtoken);
    headers.set(authorizationHeader.name, authorizationHeader.value);
    const request = new Request({
      method: RequestMethod.POST,
      headers,
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
