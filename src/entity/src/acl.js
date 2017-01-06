import { KinveyError } from 'src/errors';
import { isDefined } from 'src/utils';
import cloneDeep from 'lodash/cloneDeep';
import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import assign from 'lodash/assign';

/**
 * The Acl class is used as a wrapper for reading and setting permissions on an entity level.
 *
 * @example
 * var entity = { _acl: {} };
 * var acl = new Kinvey.Acl(entity);
 */
export default class Acl {
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
    this.acl = cloneDeep(entity._acl);
  }

  get creator() {
    return this.acl.creator;
  }

  get readers() {
    return isArray(this.acl.r) ? this.acl.r : [];
  }

  get writers() {
    return isArray(this.acl.w) ? this.acl.w : [];
  }

  get readerGroups() {
    return isDefined(this.acl.groups) && isArray(this.acl.groups.r) ? this.acl.groups.r : [];
  }

  get writerGroups() {
    return isDefined(this.acl.groups) && isArray(this.acl.groups.w) ? this.acl.groups.w : [];
  }

  set globallyReadable(gr) {
    if (gr === true) {
      this.acl.gr = gr;
    } else {
      this.acl.gr = false;
    }
  }

  set globallyWritable(gw) {
    if (gw === true) {
      this.acl.gw = gw;
    } else {
      this.acl.gw = false;
    }
  }

  addReader(user) {
    const r = this.readers;

    if (r.indexOf(user) === -1) {
      r.push(user);
    }

    this.acl.r = r;
    return this;
  }

  addReaderGroup(group) {
    const groups = this.readerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.acl.groups = assign({}, this.acl.groups, { r: groups });
    return this;
  }

  addWriter(user) {
    const w = this.writers;

    if (w.indexOf(user) === -1) {
      w.push(user);
    }

    this.acl.w = w;
    return this;
  }

  addWriterGroup(group) {
    const groups = this.writerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.acl.groups = assign({}, this.acl.groups, { w: groups });
    return this;
  }

  isGloballyReadable() {
    if (this.acl.gr === true) {
      return this.acl.gr;
    }

    return false;
  }

  isGloballyWritable() {
    if (this.acl.gw === true) {
      return this.acl.gw;
    }

    return false;
  }

  removeReader(user) {
    const r = this.readers;
    const index = r.indexOf(user);

    if (index !== -1) {
      r.splice(index, 1);
    }

    this.acl.r = r;
    return this;
  }

  removeReaderGroup(group) {
    const groups = this.readerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.acl.groups = assign({}, this.acl.groups, { r: groups });
    return this;
  }

  removeWriter(user) {
    const w = this.writers;
    const index = w.indexOf(user);

    if (index !== -1) {
      w.splice(index, 1);
    }

    this.acl.w = w;
    return this;
  }

  removeWriterGroup(group) {
    const groups = this.writerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.acl.groups = assign({}, this.acl.groups, { w: groups });
    return this;
  }

  toPlainObject() {
    return this.acl;
  }
}
