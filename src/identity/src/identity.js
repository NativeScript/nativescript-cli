import { Client } from '../../client';
import { KinveyError } from '../../errors';
import Promise from 'es6-promise';

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
    throw new KinveyError('A subclass must override this property.');
  }

  set session(session) {
    throw new KinveyError('A subclass must override this property.');
  }

  isSupported() {
    return false;
  }

  static isSupported() {
    return false;
  }

  isActive(session) {
    const currentTime = (new Date()).getTime() / 1000;
    return session && session.access_token && session.expires > currentTime;
  }

  login() {
    return Promise.reject(
      new KinveyError(null, 'Identity.login(): Not supported on this platform.')
    );
  }

  static login(clientId, options) {
    const identity = new this(options);
    return identity.login(clientId, options);
  }

  logout() {
    return Promise.reject(
      new KinveyError(null, 'Identity.logout(): Not supported on this platform.')
    );
  }

  static logout(user, options) {
    const identity = new this();
    return identity.logout(user, options);
  }
}
