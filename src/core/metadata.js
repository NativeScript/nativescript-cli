import Acl from './acl';
import { KinveyError } from './errors';
import clone from 'lodash/clone';
import isPlainObject from 'lodash/isPlainObject';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const aclAttribute = process.env.KINVEY_ACL_ATTRIBUTE || '_acl';
const privateMetadataSymbol = Symbol();

/**
 * @private
 */
class PrivateMetadata {
  constructor(entity = {}) {
    if (!isPlainObject(entity)) {
      throw new Error('kmd argument must be an object');
    }

    /**
     * The acl properties.
     *
     * @private
     * @type {Object}
     */
    this.acl = new Acl(entity[aclAttribute]);

    /**
     * The kmd properties.
     *
     * @private
     * @type {Object}
     */
    this.kmd = entity[kmdAttribute];

    /**
     * The entity.
     *
     * @private
     * @type {Object}
     */
    this.entity = entity;
  }

  set acl(acl) {
    if (!(acl instanceof Acl)) {
      throw new KinveyError('Acl argument must be of type Kinvey.Acl.');
    }

    this.acl = acl;
    this.entity[aclAttribute] = acl.toJSON();
    return this;
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

/**
 * Wrapper for accessing the `_acl` and `_kmd` properties of an entity.
 *
 * @example
 * var entity = { _acl: {}, _kmd: {}};
 * var metadata = new Kinvey.Metadat(entity);
 */
export default class Metadata {
  constructor(entity) {
    this[privateMetadataSymbol] = new PrivateMetadata(entity);
  }

  /**
   * Sets the entity ACL.
   *
   * @param   {Acl}       acl       The ACL.
   * @returns {Metadata}            The metadata.
   *
   * @throws  {KinveyError} `acl` must be of type `Kinvey.Acl`.
   */
  set acl(acl) {
    this[privateMetadataSymbol].acl = acl;
    return this;
  }

  /**
   * Returns the date when the entity was created.
   *
   * @returns {?Date} Created at date, or `null` if not set.
   */
  get createdAt() {
    return this[privateMetadataSymbol].createdAt;
  }

    /**
   * Returns the email verification status.
   *
   * @returns {?Object} The email verification status, or `null` if not set.
   */
  get emailVerification() {
    return this[privateMetadataSymbol].emailVerification;
  }

  /**
   * Returns the date when the entity was last modified.
   *
   * @returns {?Date} Last modified date, or `null` if not set.
   */
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

  /**
   * Returns JSON representation of the entity.
   *
   * @returns {Object} The metadata.
   */
  toJSON() {
    return this[privateMetadataSymbol].toJSON();
  }
}
