import clone from 'lodash/lang/clone';
import isPlainObject from 'lodash/lang/isPlainObject';
const privateMetadataSymbol = Symbol();

class PrivateMetadata {
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

export default class Metadata {
  constructor(kmd) {
    this[privateMetadataSymbol] = new PrivateMetadata(kmd);
  }

  get createdAt() {
    return this[privateMetadataSymbol].createdAt;
  }

  get emailVerification() {
    return this[privateMetadataSymbol].emailVerification;
  }

  get lastModified() {
    return this[privateMetadataSymbol].lastModified;
  }

  get lmt() {
    return this.lastModified;
  }

  get authtoken() {
    return this[privateMetadataSymbol].authtoken;
  }

  set authtoken(authtoken) {
    this[privateMetadataSymbol].authtoken = authtoken;
  }

  toJSON() {
    return this[privateMetadataSymbol].toJSON();
  }
}
