const isPlainObject = require('lodash/isPlainObject');
const { KinveyError } = require('kinvey-errors');
const { isDefined } = require('kinvey-utils/object');

/**
 * The Metadata class is used to as a wrapper for accessing the `_kmd` properties of an entity.
 */
exports.Metadata = class Metadata {
  constructor(entity) {
    if (isPlainObject(entity) === false) {
      throw new KinveyError('entity argument must be an object');
    }

    /**
     * The entity.
     *
     * @private
     * @type {Object}
     */
    entity._kmd = entity._kmd || {};
    this.entity = entity;
  }

  get createdAt() {
    if (isDefined(this.entity._kmd.ect)) {
      return new Date(this.entity._kmd.ect);
    }

    return undefined;
  }

  get ect() {
    return this.createdAt;
  }

  get emailVerification() {
    if (isDefined(this.entity._kmd.emailVerification)) {
      return this.entity._kmd.emailVerification.status;
    }

    return undefined;
  }

  get lastModified() {
    if (isDefined(this.entity._kmd.lmt)) {
      return new Date(this.entity._kmd.lmt);
    }

    return undefined;
  }

  get lmt() {
    return this.lastModified;
  }

  get authtoken() {
    return this.entity._kmd.authtoken;
  }

  isLocal() {
    return this.entity._kmd.local === true;
  }

  toPlainObject() {
    return this.entity._kmd;
  }
}
