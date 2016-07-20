import { Client } from '../../client';
import { KinveyError } from '../../errors';
import { NetworkRequest } from '../../requests/network';
import { AuthType, RequestMethod } from '../../requests/request';
import { Query } from '../../query';
import localStorage from 'local-storage';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
import assign from 'lodash/assign';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
let hello;

if (typeof window !== 'undefined') {
  hello = require('hellojs'); // eslint-disable-line global-require
}

/**
 * @private
 * Enum for Social Identities
 */
const SocialIdentity = {
  Facebook: 'facebook',
  Google: 'google',
  Kinvey: 'kinvey',
  LinkedIn: 'linkedin',
  Windows: 'windows'
};
Object.freeze(SocialIdentity);
export { SocialIdentity };

export class Social {
  constructor(options = {}) {
    this.client = options.client || Client.sharedInstance();
  }

  get identity() {
    throw new KinveyError('A subclass must override this property.');
  }

  get session() {
    try {
      return JSON.parse(localStorage.get(`${this.client.appKey}${this.identity}`));
    } catch (error) {
      return null;
    }
  }

  set session(session) {
    if (session) {
      localStorage.set(`${this.client.appKey}${this.identity}`, JSON.stringify(session));
    } else {
      localStorage.remove(`${this.client.appKey}${this.identity}`);
    }
  }

  isSupported() {
    return !!hello;
  }

  isOnline(session) {
    const currentTime = (new Date()).getTime() / 1000;
    return session && session.access_token && session.expires > currentTime;
  }

  async findClientId(options = {}) {
    options = assign({
      collectionName: 'SocialIdentities'
    }, options);

    const query = new Query().equalTo('identity', this.identity);
    const request = new NetworkRequest({
      method: RequestMethod.GET,
      authType: AuthType.None,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${appdataNamespace}/${this.client.appKey}/${options.collectionName}`
      }),
      query: query,
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    const { data } = await request.execute();

    if (data.length === 1) {
      const identityInfo = data[0];
      return identityInfo.clientId || identityInfo.appId;
    }

    throw new KinveyError(`To many identities match the ${this.identity} identity`
      + ` on the backend in the ${options.collectionName} collection.`);
  }

  async login(options = {}) {
    let session = this.session;

    if (!this.isSupported()) {
      throw new KinveyError(`Unable to login with ${this.identity}. It is not supported on this platform.`);
    }

    if (session && this.isOnline(session)) {
      return session;
    }

    const clientId = await this.findClientId(options);
    if (!clientId) {
      throw new KinveyError(`Unable to login with ${this.identity}. `
        + ' No client id was provided. Please make sure you have setup your backend correctly.');
    }

    const helloSettings = {};
    helloSettings[this.identity] = clientId;
    hello.init(helloSettings);
    await hello(this.identity).login();
    session = hello(this.identity).getAuthResponse();
    session.clientId = clientId;
    this.session = session;
    return session;
  }

  static login(options) {
    const social = new this();
    return social.login(options);
  }

  async logout() {
    const session = this.session;

    // If nobody has logged in then just return because we are logged out
    if (!session) {
      return;
    }

    if (this.isSupported()) {
      const helloSettings = {};
      helloSettings[this.identity] = session.clientId;
      hello.init(helloSettings);
      await hello(this.identity).logout();
      this.session = null;
    }
  }

  static logout() {
    const social = new this();
    return social.logout();
  }
}
