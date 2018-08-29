import isPlainObject from 'lodash/isPlainObject';

/**
 * This class provides a way to access the KMD (Kinvey Metadata)
 * information for an entity.
 */
export default class Kmd {
  constructor(kmd = {}) {
    if (!isPlainObject(kmd)) {
      throw new Error('kmd must be a plain object.');
    }

    this.kmd = kmd;
  }

  /**
   * Get the auth token.
   *
   * @returns {string} _kmd.authtoken
   */
  get authtoken() {
    return this.kmd.authtoken;
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
    if (this.kmd.ect) {
      return new Date(this.kmd.ect);
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
    if (this.kmd.lmt) {
      return new Date(this.kmd.lmt);
    }

    return undefined;
  }

  /**
   * Get the email verification details.
   *
   * @returns {Object} _kmd.emailVerification
   */
  get emailVerification() {
    return this.kmd.emailVerification;
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
    return this.kmd.local === true;
  }
}
