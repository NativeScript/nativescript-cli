import { Client } from '../../client';
import { KinveyError } from '../../errors';
import Promise from 'es6-promise';
import localStorage from 'local-storage';
import assign from 'lodash/assign';
let hello;

if (typeof window !== 'undefined') {
  hello = require('hellojs'); // eslint-disable-line global-require
}

/**
 * @private
 */
export default class Identity {
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

  static isSupported() {
    return !!hello;
  }

  isSupported() {
    return !!hello;
  }

  isOnline(session) {
    const currentTime = (new Date()).getTime() / 1000;
    return session && session.access_token && session.expires > currentTime;
  }

  login(clientId, options = {}) {
    options = assign({
      redirectUri: global.location.href,
      scope: null,
      force: null
    }, options);

    if (!this.isSupported()) {
      return Promise.reject(
        new KinveyError(`Unable to login with ${this.identity}. It is not supported on this platform.`)
      );
    }

    let session = this.session;
    if (session && this.isOnline(session)) {
      return Promise.resolve(session);
    }

    if (!clientId) {
      return Promise.reject(
        new KinveyError(`Unable to login with ${this.identity}. No client id was provided.`)
      );
    }

    const helloSettings = {};
    helloSettings[this.identity] = clientId;
    hello.init(helloSettings);
    return hello(this.identity)
      .login({
        redirect_uri: options.redirectUri,
        scope: options.scope,
        force: options.force
      })
      .then(() => {
        session = hello(this.identity).getAuthResponse();
        session.clientId = clientId;
        this.session = session;
        return session;
      });
  }

  static login(clientId, options) {
    const social = new this(options);
    return social.login(clientId, options);
  }

  logout() {
    let promise = Promise.resolve();

    if (this.isSupported()) {
      const helloSettings = {};
      helloSettings[this.identity] = this.session.clientId;
      hello.init(helloSettings);
      promise = hello(this.identity).logout();
    }

    return promise.then(() => {
      this.session = null;
    });
  }

  static logout(user, options) {
    const social = new this();
    return social.logout(user, options);
  }
}
