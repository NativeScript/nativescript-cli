const isPlainObject = require('lodash/isPlainObject');
const isArray = require('lodash/isArray');
const assign = require('lodash/assign');
const { KinveyError } = require('kinvey-errors');
const { isDefined } = require('kinvey-utils/object');

/**
 * The Acl class is used as a wrapper for reading and setting permissions on an entity level.
 *
 * @example
 * var entity = { _acl: {} };
 * var acl = new Kinvey.Acl(entity);
 */
exports.Acl = class Acl {
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
    entity._acl = entity._acl || {};
    this.entity = entity;
  }

  get creator() {
    return this.entity._acl.creator;
  }

  get readers() {
    return isArray(this.entity._acl.r) ? this.entity._acl.r : [];
  }

  get writers() {
    return isArray(this.entity._acl.w) ? this.entity._acl.w : [];
  }

  get readerGroups() {
    return isDefined(this.entity._acl.groups) && isArray(this.entity._acl.groups.r) ? this.entity._acl.groups.r : [];
  }

  get writerGroups() {
    return isDefined(this.entity._acl.groups) && isArray(this.entity._acl.groups.w) ? this.entity._acl.groups.w : [];
  }

  set globallyReadable(gr) {
    if (gr === true) {
      this.entity._acl.gr = gr;
    } else {
      this.entity._acl.gr = false;
    }
  }

  set globallyWritable(gw) {
    if (gw === true) {
      this.entity._acl.gw = gw;
    } else {
      this.entity._acl.gw = false;
    }
  }

  addReader(user) {
    const r = this.readers;

    if (r.indexOf(user) === -1) {
      r.push(user);
    }

    this.entity._acl.r = r;
    return this;
  }

  addReaderGroup(group) {
    const groups = this.readerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.entity._acl.groups = assign({}, this.entity._acl.groups, { r: groups });
    return this;
  }

  addWriter(user) {
    const w = this.writers;

    if (w.indexOf(user) === -1) {
      w.push(user);
    }

    this.entity._acl.w = w;
    return this;
  }

  addWriterGroup(group) {
    const groups = this.writerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.entity._acl.groups = assign({}, this.entity._acl.groups, { w: groups });
    return this;
  }

  isGloballyReadable() {
    if (this.entity._acl.gr === true) {
      return this.entity._acl.gr;
    }

    return false;
  }

  isGloballyWritable() {
    if (this.entity._acl.gw === true) {
      return this.entity._acl.gw;
    }

    return false;
  }

  removeReader(user) {
    const r = this.readers;
    const index = r.indexOf(user);

    if (index !== -1) {
      r.splice(index, 1);
    }

    this.entity._acl.r = r;
    return this;
  }

  removeReaderGroup(group) {
    const groups = this.readerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.entity._acl.groups = assign({}, this.entity._acl.groups, { r: groups });
    return this;
  }

  removeWriter(user) {
    const w = this.writers;
    const index = w.indexOf(user);

    if (index !== -1) {
      w.splice(index, 1);
    }

    this.entity._acl.w = w;
    return this;
  }

  removeWriterGroup(group) {
    const groups = this.writerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.entity._acl.groups = assign({}, this.entity._acl.groups, { w: groups });
    return this;
  }

  toPlainObject() {
    return this.entity._acl;
  }
}
