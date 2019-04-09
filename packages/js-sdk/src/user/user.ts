import isArray from 'lodash/isArray';
import { Acl } from '../acl';
import { Kmd } from '../kmd';
import { getDeviceId } from '../device';
import {
  getSession,
  setSession,
  removeSession,
  formatKinveyBaasUrl,
  HttpRequestMethod,
  KinveyHttpRequest,
  KinveyBaasNamespace,
  KinveyHttpAuth
} from '../http';
import { KinveyError } from '../errors/kinvey';
import { Entity } from '../storage';
import { DataStoreCache, QueryCache, SyncCache } from '../datastore/cache';
import { subscribe, unsubscribe, isSubscribed } from '../live';
import { logger } from '../log';
import { mergeSocialIdentity } from './utils';

export interface UserData extends Entity {
  _socialIdentity?: object;
  username?: string;
  email?: string;
}

export class User {
  public data: UserData;

  constructor(data: UserData = {}) {
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
      return metadata.isEmailConfirmed();
    }
    return false;
  }

  async me(options: { timeout?: number } = {}) {
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.GET,
      auth: KinveyHttpAuth.Session,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/_me'),
      timeout: options.timeout
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

  async update(data: object, options: { timeout?: number } = {}) {
    const body = Object.assign({}, this.data, data);

    if (!data) {
      throw new KinveyError('No user was provided to be updated.');
    }

    if (isArray(data)) {
      throw new KinveyError('Only one user can be updated at one time.');
    }

    if (!body._id) {
      throw new KinveyError('User must have an _id.');
    }

    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.PUT,
      auth: KinveyHttpAuth.SessionOrApp,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.User, `/${this._id}`),
      body,
      timeout: options.timeout
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

  async registerForLiveService(options: { timeout?: number } = {}) {
    if (!isSubscribed()) {
      const deviceId = getDeviceId();
      const request = new KinveyHttpRequest({
        method: HttpRequestMethod.POST,
        auth: KinveyHttpAuth.Session,
        url: formatKinveyBaasUrl(KinveyBaasNamespace.User, `/${this._id}/register-realtime`),
        body: { deviceId },
        timeout: options.timeout
      });
      const response = await request.execute();
      const config = Object.assign({}, { authKey: this.authtoken }, response.data);
      subscribe(config);
    }
    return true;
  }

  async unregisterFromLiveService(options: { timeout?: number } = {}) {
    if (isSubscribed()) {
      const deviceId = getDeviceId();
      const request = new KinveyHttpRequest({
        method: HttpRequestMethod.POST,
        auth: KinveyHttpAuth.Session,
        url: formatKinveyBaasUrl(KinveyBaasNamespace.User, `/${this._id}/unregister-realtime`),
        body: { deviceId },
        timeout: options.timeout
      });
      await request.execute();
      unsubscribe();
    }

    return true;
  }

  async logout(options: { timeout?: number } = {}) {
    if (this.isActive()) {
      // TODO: unregister push

      // Unregister from Live Service
      this.unregisterFromLiveService();

      try {
        // Logout
        const request = new KinveyHttpRequest({
          method: HttpRequestMethod.POST,
          auth: KinveyHttpAuth.Session,
          url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/_logout'),
          timeout: options.timeout
        });
        await request.execute();
      } catch (error) {
        logger.error('Logout request failed.');
        logger.error(error.message);
      }

      // Remove the session
      removeSession();

      // Clear cache's
      await QueryCache.clear();
      await SyncCache.clear();
      await DataStoreCache.clear();
    }

    return this;
  }
}
