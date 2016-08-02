import { Client } from '../../client';
import { KinveyError } from '../../errors';
import localStorage from 'local-storage';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import assign from 'lodash/assign';
let hello;

if (typeof window !== 'undefined') {
  hello = require('hellojs'); // eslint-disable-line global-require
}

/**
 * @private
 */
export class Social {
  constructor(options = {}) {
    this.client = options.client || Client.sharedInstance();
  }

  get identity() {
    throw new KinveyError('A subclass must override this property.');
  }

  static get identity() {
    throw new KinveyError('A subclass must override this property.');
  }

  get session() {
    return localStorage.get(`${this.client.appKey}${this.identity}`);
  }

  set session(session) {
    if (session) {
      localStorage.set(`${this.client.appKey}${this.identity}`, session);
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

  async login(clientId, options = {}) {
    options = assign({
      redirectUri: global.location.href,
      scope: null,
      force: null
    }, options);

    if (!this.isSupported()) {
      throw new KinveyError(`Unable to login with ${this.identity}. It is not supported on this platform.`);
    }

    let session = this.session;
    if (session && this.isOnline(session)) {
      return session;
    }

    if (!clientId) {
      throw new KinveyError(`Unable to login with ${this.identity}. `
        + ' No client id was provided.');
    }

    const helloSettings = {};
    helloSettings[this.identity] = clientId;
    hello.init(helloSettings);
    await hello(this.identity).login({
      redirect_uri: options.redirectUri,
      scope: options.scope,
      force: options.force
    });
    session = hello(this.identity).getAuthResponse();
    session.clientId = clientId;
    this.session = session;
    return session;
  }

  static login(clientId, options) {
    const social = new this(options);
    return social.login(clientId, options);
  }

  async logout() {
    if (this.isSupported()) {
      const helloSettings = {};
      helloSettings[this.identity] = this.session.clientId;
      hello.init(helloSettings);
      await hello(this.identity).logout();
    }

    this.session = null;
  }

  static logout() {
    const social = new this();
    return social.logout();
  }
}
