import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import { clear } from 'kinvey-datastore';
import { Acl } from 'kinvey-acl';
import { Kmd } from 'kinvey-kmd';
import { formatKinveyUrl, KinveyRequest, RequestMethod, Auth } from 'kinvey-http';
import { get as getSession, set as setSession, remove as removeSession } from 'kinvey-session';
import { getConfig } from 'kinvey-app';
import * as MIC from './mic';

const USER_NAMESPACE = 'user';
const RPC_NAMESPACE = 'rpc';

export { AuthorizationGrant } from './mic';

export class User {
  constructor(data = {}) {
    this.data = data;
  }

  get _id() {
    if (this.data) {
      return this.data._id;
    }
    return undefined;
  }

  get _acl() {
    if (this.data) {
      return new Acl(this.data);
    }
    return undefined;
  }

  get _kmd() {
    if (this.data) {
      return new Kmd(this.data);
    }
    return undefined;
  }

  get metadata() {
    return this._kmd;
  }

  get username() {
    if (this.data) {
      return this.data.username;
    }
    return undefined;
  }

  get email() {
    if (this.data) {
      return this.data.email;
    }
    return undefined;
  }

  isActive() {
    const activeUser = getSession();
    if (activeUser && activeUser._id === this._id) {
      return true;
    }
    return false;
  }

  isEmailVerified() {
    const metadata = this.metadata;
    if (metadata) {
      const status = metadata.emailVerification;
      return status === 'confirmed';
    }
    return false;
  }

  async me() {
    const { api, appKey } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      headers: {
        Authorization: Auth.Session(getSession())
      },
      url: formatKinveyUrl(api.protocol, api.host, `/${USER_NAMESPACE}/${appKey}/_me`)
    });
    const response = await request.execute();
    const data = response.data;
    delete data.password; // Remove sensitive data
    this.data = data;

    if (this.isActive()) {
      setSession(this.data);
    }

    return this;
  }

  async update(data) {
    const { api, appKey, masterSecret } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.PUT,
      headers: {
        Authorization: Auth.Default(getSession(), appKey, masterSecret)
      },
      url: formatKinveyUrl(api.protocol, api.host, `/${USER_NAMESPACE}/${appKey}/${this._id}`),
      body: Object.assign(this.data, data)
    });
    const response = await request.execute();
    this.data = response.data;

    if (this.isActive()) {
      setSession(this.data);
    }

    return this;
  }
}

export function getActiveUser() {
  const session = getSession();

  if (session) {
    return new User(session);
  }

  return null;
}

export async function signup(data, options = {}) {
  const { api, appKey, appSecret } = getConfig();
  const activeUser = getSession();
  const { state = true } = options;

  if (state === true && activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you signup.');
  }

  const url = formatKinveyUrl(api.protocol, api.host, `/${USER_NAMESPACE}/${appKey}`);
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      Authorization: Auth.App(appKey, appSecret)
    },
    url,
    body: isEmpty(data) ? null : data
  });
  const response = await request.execute();
  const userData = response.data;

  if (state === true) {
    setSession(userData);
  }

  return new User(userData);
}

export async function login(username, password) {
  const { api, appKey, appSecret } = getConfig();
  const activeUser = getActiveUser();
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
    headers: {
      Authorization: Auth.App(appKey, appSecret)
    },
    url: formatKinveyUrl(api.protocol, api.host, `/${USER_NAMESPACE}/${appKey}/login`),
    body: credentials
  });
  const response = await request.execute();
  const userData = response.data;
  setSession(userData);
  return new User(userData);
}

export async function loginWithMIC(redirectUri, authorizationGrant, options) {
  const activeUser = getActiveUser();

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
  const { api, appKey } = getConfig();
  const activeUser = getActiveUser();

  if (activeUser) {
    // TODO: unregister from live service and push

    const url = formatKinveyUrl(api.protocol, api.host, `/${USER_NAMESPACE}/${appKey}/_logout`);
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      headers: {
        Authorization: Auth.Session(getSession())
      },
      url
    });

    try {
      await request.execute();
    } catch (error) {
      // TODO: log error
    }

    removeSession();
    await clear();
    return activeUser;
  }

  return null;
}

export async function me() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.me();
  }

  return null;
}

export async function update(data) {
  const activeUser = getActiveUser();

  if (isArray(data)) {
    throw new Error('Only one user can be updated at one time.');
  }

  if (activeUser) {
    return activeUser.update(data);
  }

  return null;
}

export async function remove(id, options = {}) {
  const { api, appKey, masterSecret } = getConfig();
  const { hard = false } = options;

  if (!id) {
    throw new Error('An id was not provided.');
  }

  if (!isString(id)) {
    throw new Error('The id provided is not a string.');
  }

  const url = formatKinveyUrl(api.protocol, api.host, `/user/${appKey}/${id}`, { hard });
  const request = new KinveyRequest({
    method: RequestMethod.DELETE,
    headers: {
      Authorization: Auth.Default(getSession(), appKey, masterSecret)
    },
    url
  });
  const response = await request.execute();
  removeSession();
  return response.data;
}

export async function verifyEmail(username) {
  const { api, appKey, appSecret } = getConfig();

  if (!username) {
    throw new Error('A username was not provided.');
  }

  if (!isString(username)) {
    throw new Error('The provided username is not a string.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      Authorization: Auth.App(appKey, appSecret)
    },
    url: formatKinveyUrl(api.protocol, api.host, `/${RPC_NAMESPACE}/${appKey}/${username}/user-email-verification-initiate`)
  });
  const response = await request.execute();
  return response.data;
}

export async function forgotUsername(email) {
  const { api, appKey, appSecret } = getConfig();

  if (!email) {
    throw new Error('An email was not provided.');
  }

  if (!isString(email)) {
    throw new Error('The provided email is not a string.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      Authorization: Auth.App(appKey, appSecret)
    },
    url: formatKinveyUrl(api.protocol, api.host, `/${RPC_NAMESPACE}/${appKey}/user-forgot-username`),
    body: { email }
  });
  const response = await request.execute();
  return response.data;
}

export async function resetPassword(username) {
  const { api, appKey, appSecret } = getConfig();

  if (!username) {
    throw new Error('A username was not provided.');
  }

  if (!isString(username)) {
    throw new Error('The provided username is not a string.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      Authorization: Auth.App(appKey, appSecret)
    },
    url: formatKinveyUrl(api.protocol, api.host, `/${RPC_NAMESPACE}/${appKey}/${username}/user-password-reset-initiate`)
  });
  const response = await request.execute();
  return response.data;
}

export async function lookup(query) {
  const { api, appKey, masterSecret } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      Authorization: Auth.Default(getSession(), appKey, masterSecret)
    },
    url: formatKinveyUrl(api.protocol, api.host, `/${USER_NAMESPACE}/${appKey}/_lookup`),
    body: query ? query.filter : undefined
  });
  const response = await request.execute();
  return response.data;
}

export async function exists(username) {
  const { api, appKey, appSecret } = getConfig();

  if (!username) {
    throw new Error('A username was not provided.');
  }

  if (!isString(username)) {
    throw new Error('The provided username is not a string.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    headers: {
      Authorization: Auth.App(appKey, appSecret)
    },
    url: formatKinveyUrl(api.protocol, api.host, `/${RPC_NAMESPACE}/${appKey}/check-username-exists`),
    body: { username }
  });
  const response = await request.execute();
  return response.data.usernameExists === true;
}
