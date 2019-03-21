import isPlainObject from 'lodash/isPlainObject';
import KinveyError from './errors/kinvey';

export default class Kmd {
  public entity: any;

  constructor(entity) {
    if (!isPlainObject(entity)) {
      throw new KinveyError('entity argument must be an object');
    }

    entity._kmd = entity._kmd || {}; // eslint-disable-line no-param-reassign
    this.entity = entity;
  }

  get authtoken() {
    return this.entity._kmd.authtoken;
  }

  get ect() {
    return this.createdAt;
  }

  get createdAt() {
    if (this.entity._kmd.ect) {
      return new Date(this.entity._kmd.ect);
    }

    return undefined;
  }

  get lmt() {
    return this.updatedAt;
  }

  get lastModified() {
    return this.updatedAt;
  }

  get updatedAt() {
    if (this.entity._kmd.lmt) {
      return new Date(this.entity._kmd.lmt);
    }

    return undefined;
  }

  get emailVerification() {
    if (this.entity._kmd.emailVerification) {
      return this.entity._kmd.emailVerification.status;
    }

    return undefined;
  }

  isEmailConfirmed() {
    if (this.emailVerification) {
      return this.emailVerification.status === 'confirmed';
    }

    return false;
  }

  isLocal() {
    return this.entity._kmd.local === true;
  }

  toPlainObject() {
    return this.entity._kmd;
  }
}
