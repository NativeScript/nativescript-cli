import { KinveyError } from './errors';
import clone from 'lodash/clone';
import isPlainObject from 'lodash/isPlainObject';
const aclAttribute = process.env.KINVEY_ACL_ATTRIBUTE || '_acl';

/**
 * Wrapper for reading and setting permissions on an entity level.
 *
 * @example
 * var entity = { _acl: {} };
 * var acl = new Kinvey.Acl(entity);
 */
export class Acl {
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
    this.acl = clone(entity[aclAttribute]);
  }

  get creator() {
    return this.acl.creator;
  }

  get readers() {
    return this.acl.r || [];
  }

  get writers() {
    return this.acl.w || [];
  }

  get readerGroups() {
    return this.acl.groups ? this.acl.groups.r : [];
  }

  get writerGroups() {
    return this.acl.groups ? this.acl.groups.w : [];
  }

  set globallyReadable(gr) {
    this.acl.gr = gr || false;
  }

  set globallyWritable(gw) {
    this.acl.gw = gw || false;
  }

  addReader(user) {
    const r = this.acl.r || [];

    if (r.indexOf(user) === -1) {
      r.push(user);
    }

    this.acl.r = r;
    return this;
  }

  addReaderGroup(group) {
    const groups = this.acl.groups || {};
    const r = groups.r || [];

    if (r.indexOf(group) === -1) {
      r.push(group);
    }

    groups.r = r;
    this.acl.groups = groups;
    return this;
  }

  addWriter(user) {
    const w = this.acl.w || [];

    if (w.indexOf(user) === -1) {
      w.push(user);
    }

    this.acl.w = w;
    return this;
  }

  addWriterGroup(group) {
    const groups = this.acl.groups || {};
    const w = groups.w || [];

    if (w.indexOf(group) === -1) {
      w.push(group);
    }

    groups.w = w;
    this.acl.groups = groups;
    return this;
  }

  isGloballyReadable() {
    return this.acl.gr || false;
  }

  isGloballyWritable() {
    return this.acl.gw || false;
  }

  removeReader(user) {
    const r = this.acl.r || [];
    const pos = r.indexOf(user);

    if (pos !== -1) {
      r.splice(pos, 1);
    }

    this.acl.r = r;
    return this;
  }

  removeReaderGroup(group) {
    const groups = this.acl.groups || {};
    const r = groups.r || [];
    const pos = r.indexOf(group);

    if (pos !== -1) {
      r.splice(pos, 1);
    }

    groups.r = r;
    this.acl.groups = groups;
    return this;
  }

  removeWriter(user) {
    const w = this.acl.w || [];
    const pos = w.indexOf(user);

    if (pos !== -1) {
      w.splice(pos, 1);
    }

    this.acl.w = w;
    return this;
  }

  removeWriterGroup(group) {
    const groups = this.acl.groups || {};
    const w = groups.w || [];
    const pos = w.indexOf(group);

    if (pos !== -1) {
      w.splice(pos, 1);
    }

    groups.w = w;
    this.acl.groups = groups;
    return this;
  }

  toJSON() {
    return this.acl;
  }
}
