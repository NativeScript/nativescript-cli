const clone = require('lodash/lang/clone');
const isPlainObject = require('lodash/lang/isPlainObject');
const privateMetadataSymbol = Symbol();

class PrivateMetadata {
  constructor(kmd) {
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

  toJSON() {
    return clone(this.kmd);
  }
}

class Metadata {
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

  toJSON() {
    return this[privateMetadataSymbol].toJSON();
  }
}

module.exports = Metadata;
