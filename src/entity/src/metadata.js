import { KinveyError } from 'src/errors';
import { isDefined } from 'src/utils';
import isPlainObject from 'lodash/isPlainObject';

/**
 * The Metadata class is used to as a wrapper for accessing the `_kmd` properties of an entity.
 */
export default class Metadata {
  constructor(entity) {
    if (!isPlainObject(entity)) {
      throw new KinveyError('entity argument must be an object');
    }

    /**
     * The kmd properties.
     *
     * @private
     * @type {Object}
     */
    this.kmd = entity._kmd || {};
  }

  get createdAt() {
    if (this.kmd.ect) {
      return new Date(this.kmd.ect);
    }

    return undefined;
  }

  get ect() {
    return this.createdAt;
  }

  get emailVerification() {
    if (isDefined(this.kmd.emailVerification)) {
      return this.kmd.emailVerification.status;
    }

    return undefined;
  }

  get lastModified() {
    if (this.kmd.lmt) {
      return new Date(this.kmd.lmt);
    }

    return undefined;
  }

  get lmt() {
    return this.lastModified;
  }

  get authtoken() {
    return this.kmd.authtoken;
  }

  isLocal() {
    return this.kmd.local === true;
  }

  toPlainObject() {
    return this.kmd;
  }
}
