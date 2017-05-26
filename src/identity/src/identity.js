import Client from 'src/client';
import { KinveyError } from 'src/errors';

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

  static isSupported() {
    return false;
  }

  isSupported() {
    return false;
  }

  isOnline(session) {
    const currentTime = (new Date()).getTime() / 1000;
    return session && session.access_token && session.expires > currentTime;
  }
}
