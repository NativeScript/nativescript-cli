import isPlainObject from 'lodash/isPlainObject';
import { KinveyError } from './errors/kinvey';
import { Entity } from './storage';

/**
 * This class provides a way to access the KMD (Kinvey Metadata)
 * information for an entity.
 */
export class Kmd {
  private entity: Entity;

  constructor(entity: Entity) {
    if (!isPlainObject(entity)) {
      throw new KinveyError('entity argument must be an object');
    }

    entity._kmd = entity._kmd || {}; // eslint-disable-line no-param-reassign
    this.entity = entity;
  }

  /**
   * Get the auth token.
   *
   * @returns {string} _kmd.authtoken
   */
  get authtoken() {
    return (this.entity._kmd && this.entity._kmd.authtoken) || null;
  }

  /**
   * Get created at time.
   *
   * @returns {Date?} _kmd.ect
   */
  get ect() {
    return this.createdAt;
  }

  /**
   * Get created at time.
   *
   * @returns {Date?} _kmd.ect
   */
  get createdAt() {
    if (this.entity._kmd && this.entity._kmd.ect) {
      return new Date(this.entity._kmd.ect);
    }

    return undefined;
  }

  /**
   * Get last modified time.
   *
   * @returns {Date?} _kmd.lmt
   */
  get lmt() {
    return this.updatedAt;
  }

  /**
   * Get last modified time.
   *
   * @returns {Date?} _kmd.lmt
   */
  get lastModified() {
    return this.updatedAt;
  }

  /**
   * Get last modified time.
   *
   * @returns {Date?} _kmd.lmt
   */
  get updatedAt() {
    if (this.entity._kmd && this.entity._kmd.lmt) {
      return new Date(this.entity._kmd.lmt);
    }

    return undefined;
  }

  /**
   * Get the email verification details.
   *
   * @returns {Object} _kmd.emailVerification
   */
  get emailVerification() {
    if (this.entity._kmd && this.entity._kmd.emailVerification) {
      return this.entity._kmd.emailVerification;
    }

    return undefined;
  }

  /**
   * Checks if an email for a user has been confirmed.
   *
   * @returns {boolean} True if the email has been confirmed otherwise false
   */
  isEmailConfirmed() {
    if (this.emailVerification) {
      return this.emailVerification.status === 'confirmed';
    }

    return false;
  }

  /**
   * Checks if the entity has been created locally.
   *
   * @returns {boolean} True if the entity has been created locally otherwise false
   */
  isLocal() {
    return (this.entity._kmd && this.entity._kmd.local === true) || false;
  }

  toPlainObject() {
    return this.entity._kmd;
  }
}
