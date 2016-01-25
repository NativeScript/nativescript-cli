import clone from 'lodash/lang/clone';
import isPlainObject from 'lodash/lang/isPlainObject';
const privateKmdSymbol = Symbol();

class PrivateKmd {
  constructor(kmd = {}) {
    if (!isPlainObject(kmd)) {
      throw new Error('kmd argument must be an object');
    }

    this.kmd = kmd;
  }

  get createdAt() {
    if (this.kmd.ect) {
      return Date.parse(this.kmd.ect);
    }

    return undefined;
  }

  get emailVerification() {
    return this.kmd.emailVerification;
  }

  get lastModified() {
    if (this.kmd.lmt) {
      return Date.parse(this.kmd.lmt);
    }

    return undefined;
  }

  get authtoken() {
    return this.kmd.authtoken;
  }

  set authtoken(authtoken) {
    this.kmd.authtoken = authtoken;
  }

  toJSON() {
    return clone(this.kmd);
  }
}

export default class Kmd {
  constructor(kmd) {
    this[privateKmdSymbol] = new PrivateKmd(kmd);
  }

  get createdAt() {
    return this[privateKmdSymbol].createdAt;
  }

  get emailVerification() {
    return this[privateKmdSymbol].emailVerification;
  }

  get lastModified() {
    return this[privateKmdSymbol].lastModified;
  }

  get lmt() {
    return this.lastModified;
  }

  get authtoken() {
    return this[privateKmdSymbol].authtoken;
  }

  set authtoken(authtoken) {
    this[privateKmdSymbol].authtoken = authtoken;
  }

  toJSON() {
    return this[privateKmdSymbol].toJSON();
  }
}
