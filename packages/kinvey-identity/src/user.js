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
import { ActiveUserError, KinveyError } from 'kinvey-errors';
import { Query } from 'kinvey-query';
import { KinveyObservable } from 'kinvey-observable';
import * as MIC from './mic';
import { mergeSocialIdentity } from './utils';

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

  get authtoken() {
    const kmd = this._kmd;

    if (kmd) {
      return kmd.authtoken;
    }

    return undefined;
  }

  get _socialIdentity() {
    return this.data._socialIdentity;
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

    // Remove sensitive data
    delete data.password;

    // Merge _socialIdentity
    if (data._socialIdentity) {
      data._socialIdentity = mergeSocialIdentity(this._socialIdentity, data._socialIdentity);
    }

    // Update the active session
    if (this.isActive()) {
      setSession(data);
    }

    this.data = data;
    return this;
  }

  async update(data) {
    const { api, appKey, masterSecret } = getConfig();
    const body = Object.assign(this.data, data);

    if (!data) {
      throw new KinveyError('No user was provided to be updated.');
    }

    if (isArray(data)) {
      throw new KinveyError('Only one user can be updated at one time.');
    }

    if (!body._id) {
      throw new KinveyError('User must have an _id.');
    }

    const request = new KinveyRequest({
      method: RequestMethod.PUT,
      headers: {
        Authorization: Auth.Default(getSession(), appKey, masterSecret)
      },
      url: formatKinveyUrl(api.protocol, api.host, `/${USER_NAMESPACE}/${appKey}/${this._id}`),
      body
    });
    const response = await request.execute();
    const updatedData = response.data;

    // Remove sensitive data
    delete updatedData.password;

    // Merge _socialIdentity
    if (updatedData._socialIdentity) {
      updatedData._socialIdentity = mergeSocialIdentity(this._socialIdentity, updatedData._socialIdentity);
    }

    // Update the active session
    if (this.isActive()) {
      setSession(updatedData);
    }

    this.data = updatedData;
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
    throw new ActiveUserError('An active user already exists. Please logout the active user before you signup.');
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
  const session = response.data;

  if (state === true) {
    setSession(session);
  }

  return new User(session);
}

export async function login(username, password) {
  const { api, appKey, appSecret } = getConfig();
  const activeUser = getActiveUser();
  let credentials = username;

  if (activeUser) {
    throw new ActiveUserError('An active user already exists. Please logout the active user before you login.');
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
    throw new KinveyError('Username and/or password missing. Please provide both a username and password to login.');
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

export async function loginWithMIC(redirectUri, authorizationGrant, options) {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new ActiveUserError(
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
    try {
      // TODO: unregister from live service and push

      const url = formatKinveyUrl(api.protocol, api.host, `/${USER_NAMESPACE}/${appKey}/_logout`);
      const request = new KinveyRequest({
        method: RequestMethod.POST,
        headers: {
          Authorization: Auth.Session(getSession())
        },
        url
      });
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

  if (activeUser) {
    return activeUser.update(data);
  }

  return null;
}

export async function remove(id, options = {}) {
  const { api, appKey, masterSecret } = getConfig();
  const { hard } = options;

  if (!id) {
    throw new KinveyError('An id was not provided.');
  }

  if (!isString(id)) {
    throw new KinveyError('The id provided is not a string.');
  }

  const url = formatKinveyUrl(api.protocol, api.host, `/user/${appKey}/${id}`, { hard: hard ? hard === true : undefined });
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
    throw new KinveyError('A username was not provided.');
  }

  if (!isString(username)) {
    throw new KinveyError('The provided username is not a string.');
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
    throw new KinveyError('An email was not provided.');
  }

  if (!isString(email)) {
    throw new KinveyError('The provided email is not a string.');
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
    throw new KinveyError('A username was not provided.');
  }

  if (!isString(username)) {
    throw new KinveyError('The provided username is not a string.');
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

export function lookup(query) {
  const stream = KinveyObservable.create(async (observer) => {
    try {
      if (query && !(query instanceof Query)) {
        throw new KinveyError('Invalid query. It must be an instance of the Query class.');
      }

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
      observer.next(response.data);
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  });
  return stream;
}

export async function exists(username) {
  const { api, appKey, appSecret } = getConfig();

  if (!username) {
    throw new KinveyError('A username was not provided.');
  }

  if (!isString(username)) {
    throw new KinveyError('The provided username is not a string.');
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
