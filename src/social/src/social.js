import { Client } from '../../client';
import localStorage from 'local-storage';

export class Social {
  constructor(appId, options = {}) {
    this.appId = appId;
    this.loggedIn = false;
    this.client = options.client || Client.sharedInstance();
  }

  get identity() {
    throw new Error('A subclass must override this property.');
  }

  get token() {
    try {
      return JSON.parse(localStorage.get(`${this.client.appKey}${this.identity}`));
    } catch (error) {
      return null;
    }
  }

  set token(token) {
    if (token) {
      localStorage.set(`${this.client.appKey}${this.identity}`, JSON.stringify(token));
    } else {
      localStorage.remove(`${this.client.appKey}${this.identity}`);
    }
  }
}
