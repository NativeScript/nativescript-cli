import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import assign from 'lodash/assign';
import { KinveyError } from './errors';
import { isDefined } from './utils';

/**
 * The Acl class is used as a wrapper for reading and setting permissions on an entity level.
 */
export class Acl {
  constructor(entity) {
    if (isPlainObject(entity) === false) {
      throw new KinveyError('entity argument must be an object');
    }

    entity._acl = entity._acl || {};

    /**
     * @private
     */
    this.entity = entity;
  }

  /**
   * @returns {string} Creator
   */
  get creator() {
    return this.entity._acl.creator;
  }

  /**
   * @returns {string[]} Readers
   */
  get readers() {
    return isArray(this.entity._acl.r) ? this.entity._acl.r : [];
  }

  /**
   * @returns {string[]} Writers
   */
  get writers() {
    return isArray(this.entity._acl.w) ? this.entity._acl.w : [];
  }

  /**
   * @returns {string[]} Reader Groups
   */
  get readerGroups() {
    return isDefined(this.entity._acl.groups) && isArray(this.entity._acl.groups.r) ? this.entity._acl.groups.r : [];
  }

  /**
   * @returns {string[]} Writer Groups
   */
  get writerGroups() {
    return isDefined(this.entity._acl.groups) && isArray(this.entity._acl.groups.w) ? this.entity._acl.groups.w : [];
  }

  /**
   * @param {boolean} gr Globally readable
   */
  set globallyReadable(gr) {
    if (gr === true) {
      this.entity._acl.gr = gr;
    } else {
      this.entity._acl.gr = false;
    }
  }

  /**
   * @param {boolean} gw Globally writable
   */
  set globallyWritable(gw) {
    if (gw === true) {
      this.entity._acl.gw = gw;
    } else {
      this.entity._acl.gw = false;
    }
  }

  /**
   * Add a reader.
   *
   * @param {string} user Reader
   *
   * @returns {Acl} Acl instance
   */
  addReader(user) {
    const r = this.readers;

    if (r.indexOf(user) === -1) {
      r.push(user);
    }

    this.entity._acl.r = r;
    return this;
  }

  /**
   * Add a reader group.
   *
   * @param {string} group Reader group
   *
   * @returns {Acl} Acl instance
   */
  addReaderGroup(group) {
    const groups = this.readerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.entity._acl.groups = assign({}, this.entity._acl.groups, { r: groups });
    return this;
  }

  /**
   * Add a writer.
   *
   * @param {string} user Writer
   *
   * @returns {Acl} Acl instance
   */
  addWriter(user) {
    const w = this.writers;

    if (w.indexOf(user) === -1) {
      w.push(user);
    }

    this.entity._acl.w = w;
    return this;
  }

  /**
   * Add a writer group.
   *
   * @param {string} group Writer group
   *
   * @returns {Acl} Acl instance
   */
  addWriterGroup(group) {
    const groups = this.writerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.entity._acl.groups = assign({}, this.entity._acl.groups, { w: groups });
    return this;
  }

  /**
   * Check if global reading is allowed.
   *
   * @returns {boolean} True if global reading is allowed otherwise false.
   */
  isGloballyReadable() {
    if (this.entity._acl.gr === true) {
      return this.entity._acl.gr;
    }

    return false;
  }

  /**
   * Check if global writing is allowed.
   *
   * @returns {boolean} True if global writing is allowed otherwise false.
   */
  isGloballyWritable() {
    if (this.entity._acl.gw === true) {
      return this.entity._acl.gw;
    }

    return false;
  }

  /**
   * Remove a reader.
   *
   * @param {string} user Reader
   *
   * @returns {Acl} Acl instance
   */
  removeReader(user) {
    const r = this.readers;
    const index = r.indexOf(user);

    if (index !== -1) {
      r.splice(index, 1);
    }

    this.entity._acl.r = r;
    return this;
  }

  /**
   * Remove a reader group.
   *
   * @param {string} group Reader group
   *
   * @returns {Acl} Acl instance
   */
  removeReaderGroup(group) {
    const groups = this.readerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.entity._acl.groups = assign({}, this.entity._acl.groups, { r: groups });
    return this;
  }

  /**
   * Remove a writer.
   *
   * @param {string} user Writer
   *
   * @returns {Acl} Acl instance
   */
  removeWriter(user) {
    const w = this.writers;
    const index = w.indexOf(user);

    if (index !== -1) {
      w.splice(index, 1);
    }

    this.entity._acl.w = w;
    return this;
  }

  /**
   * Remove a writer group.
   *
   * @param {string} group Writer group
   *
   * @returns {Acl} Acl instance
   */
  removeWriterGroup(group) {
    const groups = this.writerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.entity._acl.groups = assign({}, this.entity._acl.groups, { w: groups });
    return this;
  }

  /**
   * The acl as a plain object.
   *
   * @returns {Object} Acl as a plain object.
   */
  toPlainObject() {
    return this.entity._acl;
  }
}
