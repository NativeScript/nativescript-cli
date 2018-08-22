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

export default class User {
  constructor(data = {}) {
    this.data = data;
  }

  static getActiveUser() {
    const session = getSession();

    if (session) {
      return new User(session);
    }

    return null;
  }

  static async signup(data, options = {}) {
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
    const userData = response.data;

    if (state === true) {
      setSession(userData);
    }

    return new User(userData);
  }

  static async login(username, password) {
    const activeUser = User.getActiveUser();
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
    const userData = response.data;
    setSession(userData);
    return new User(userData);
  }

  static async loginWithMIC(redirectUri, authorizationGrant, options) {
    const activeUser = User.getActiveUser();

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

  static async logout() {
    const activeUser = User.getActiveUser();

    // TODO: unregister from live service

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

      removeSession();
      await clearCache();
    }

    return true;
  }

  static async remove(id, options = {}) {
    const { hard = false } = options;
    const activeUser = User.getActiveUser();

    if (!isString(id)) {
      throw new Error('id must be a string.');
    }

    const url = formatKinveyBaasUrl(`/user/appKey/${id}`, { hard });
    const request = new KinveyRequest({
      method: RequestMethod.DELETE,
      auth: activeUser ? Auth.Session : Auth.MasterSecret,
      url
    });
    const response = await execute(request);
    removeSession();
    return response.data;
  }
}
