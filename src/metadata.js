import { KinveyError } from './errors';
import isPlainObject from 'lodash/isPlainObject';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

/**
 * Wrapper for accessing the `_kmd` properties of an entity.
 */
export class Metadata {
  constructor(entity = {}) {
    if (!isPlainObject(entity)) {
      throw new KinveyError('entity argument must be an object');
    }

    /**
     * The kmd properties.
     *
     * @private
     * @type {Object}
     */
    this.kmd = entity[kmdAttribute] || {};

    /**
     * The entity.
     *
     * @private
     * @type {Object}
     */
    this.entity = entity;
  }

  get createdAt() {
    if (this.kmd.ect) {
      return Date.parse(this.kmd.ect);
    }

    return undefined;
  }

  get emailVerification() {
    return this.kmd.emailVerification.status;
  }

  get lastModified() {
    if (this.kmd.lmt) {
      return Date.parse(this.kmd.lmt);
    }

    return undefined;
  }

  get lmt() {
    return this.lastModified;
  }

  get authtoken() {
    return this.kmd.authtoken;
  }

  set authtoken(authtoken) {
    this.kmd.authtoken = authtoken;
  }

  toJSON() {
    return this.kmd;
  }
}
