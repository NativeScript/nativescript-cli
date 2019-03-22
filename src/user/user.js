import isArray from 'lodash/isArray';
import Acl from '../acl';
import Kmd from '../kmd';
import { get as getSession, set as setSession, remove as removeSession } from './session';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import { get as getConfig } from '../kinvey/config';
import { get as getDeviceId } from '../device';
import KinveyError from '../errors/kinvey';
import { DataStoreCache, QueryCache, SyncCache } from '../datastore/cache';
import { isRegistered, register, unregister } from '../live/live';
import { mergeSocialIdentity } from './utils';

const USER_NAMESPACE = 'user';

export default class User {
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

  async me(options = {}) {
    const { apiProtocol, apiHost, appKey } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `/${USER_NAMESPACE}/${appKey}/_me`),
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

  async update(data, options = {}) {
    const { apiProtocol, apiHost, appKey } = getConfig();
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

    const request = new KinveyRequest({
      method: RequestMethod.PUT,
      auth: Auth.Default,
      url: formatKinveyUrl(apiProtocol, apiHost, `/${USER_NAMESPACE}/${appKey}/${this._id}`),
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

  async registerForLiveService() {
    if (!isRegistered()) {
      const { apiProtocol, apiHost, appKey } = getConfig();
      const deviceId = getDeviceId();
      const request = new KinveyRequest({
        method: RequestMethod.POST,
        auth: Auth.Session,
        url: formatKinveyUrl(apiProtocol, apiHost, `/${USER_NAMESPACE}/${appKey}/${this._id}/register-realtime`),
        body: { deviceId }
      });
      const response = await request.execute();
      const config = Object.assign({}, { authKey: this.authtoken }, response.data);
      register(config);
    }

    return true;
  }

  async unregisterFromLiveService() {
    if (isRegistered()) {
      const { apiProtocol, apiHost, appKey } = getConfig();
      const deviceId = getDeviceId();
      const request = new KinveyRequest({
        method: RequestMethod.POST,
        auth: Auth.Session,
        url: formatKinveyUrl(apiProtocol, apiHost, `/${USER_NAMESPACE}/${appKey}/${this._id}/unregister-realtime`),
        body: { deviceId }
      });
      await request.execute();
      unregister();
    }

    return true;
  }

  async logout(options = {}) {
    const { apiProtocol, apiHost, appKey } = getConfig();

    if (this.isActive()) {
      // TODO: unregister push

      // Unregister from Live Service
      this.unregisterFromLiveService();

      try {
        // Logout
        const url = formatKinveyUrl(apiProtocol, apiHost, `/${USER_NAMESPACE}/${appKey}/_logout`);
        const request = new KinveyRequest({
          method: RequestMethod.POST,
          auth: Auth.Session,
          url,
          timeout: options.timeout
        });
        await request.execute();
      } catch (error) {
        // TODO: log error
      }

      // Remove the session
      removeSession();

      // Clear the query cache
      const queryCache = new QueryCache();
      await queryCache.clearAll();

      // Clear the sync cache
      const syncCache = new SyncCache();
      await syncCache.clearAll();

      // Clear the datastore cache
      const datastoreCache = new DataStoreCache();
      await datastoreCache.clearAll();
    }

    return this;
  }
}
