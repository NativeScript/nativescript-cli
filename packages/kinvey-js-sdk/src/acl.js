import isPlainObject from 'lodash/isPlainObject';

/**
 * This class provides a way to access the ACL (Access Control List)
 * information for an entity and to modify the access control permissions.
 */
export default class Acl {
  constructor(entity = {}) {
    if (!isPlainObject(entity)) {
      throw new Error('entity must be a plain object.');
    }

    entity._acl = entity._acl || {};
    this.entity = entity;
  }

  /**
   * Get the creator.
   *
   * @returns {string} Creator
   */
  get creator() {
    return this.entity._acl.creator;
  }

  /**
   * Get the readers.
   *
   * @returns {string[]} Readers
   */
  get readers() {
    return Array.isArray(this.entity._acl.r) ? this.entity._acl.r : [];
  }

  /**
   * Get the writers.
   *
   * @returns {string[]} Writers
   */
  get writers() {
    return Array.isArray(this.entity._acl.w) ? this.entity._acl.w : [];
  }

  /**
   * Get the reader groups.
   *
   * @returns {string[]} Reader groups
   */
  get readerGroups() {
    return this.entity._acl.groups && Array.isArray(this.entity._acl.groups.r) ? this.entity._acl.groups.r : [];
  }

  /**
   * Get the writer groups.
   *
   * @returns {string[]} Writer groups
   */
  get writerGroups() {
    return this.entity._acl.groups && Array.isArray(this.entity._acl.groups.w) ? this.entity._acl.groups.w : [];
  }

  /**
   * Set the globally readable permission.
   *
   * @param {boolean} gr Globally readable
   */
  set globallyReadable(gr) {
    this.entity._acl.gr = gr === true;
  }

  /**
   * Set the globally writable permission.
   *
   * @param {boolean} gw Globally writable
   */
  set globallyWritable(gw) {
    this.entity._acl.gw = gw === true;
  }

  /**
   * Add a reader.
   *
   * @param {string} reader Reader
   * @returns {Acl} Acl
   */
  addReader(reader) {
    const r = this.readers;

    if (r.indexOf(reader) === -1) {
      r.push(reader);
    }

    this.entity._acl.r = r;
    return this;
  }

  /**
   * Add a reader group.
   *
   * @param {string} group Reader group
   * @returns {Acl} Acl
   */
  addReaderGroup(group) {
    const groups = this.readerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.entity._acl = Object.assign(this.entity._acl, { groups: {} });
    this.entity._acl.groups = Object.assign(this.entity._acl.groups, { r: groups });
    return this;
  }

  /**
   * Add a writer.
   *
   * @param {string} writer Writer
   * @returns {Acl} Acl
   */
  addWriter(writer) {
    const w = this.writers;

    if (w.indexOf(writer) === -1) {
      w.push(writer);
    }

    this.entity._acl.w = w;
    return this;
  }

  /**
   * Add a writer group.
   *
   * @param {string} group Writer group
   * @returns {Acl} Acl
   */
  addWriterGroup(group) {
    const groups = this.writerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.entity._acl = Object.assign(this.entity._acl, { groups: {} });
    this.entity._acl.groups = Object.assign(this.entity._acl.groups, { w: groups });
    return this;
  }

  /**
   * Check if globally readable is allowed.
   *
   * @returns {boolean} True if globally readable is allowed otherwise false
   */
  isGloballyReadable() {
    return this.entity._acl.gr === true;
  }

  /**
   * Check if globally writable is allowed.
   *
   * @returns {boolean} True if globally writable is allowed otherwise false
   */
  isGloballyWritable() {
    return this.entity._acl.gw === true;
  }

  /**
   * Remove a reader.
   *
   * @param {string} reader Reader
   * @returns {Acl} Acl
   */
  removeReader(reader) {
    const r = this.readers;
    const index = r.indexOf(reader);

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
   * @returns {Acl} Acl
   */
  removeReaderGroup(group) {
    const groups = this.readerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.entity._acl.groups = Object.assign(this.entity._acl.groups, { r: groups });
    return this;
  }

  /**
   * Remove a writer.
   *
   * @param {string} writer Writer
   * @returns {Acl} Acl
   */
  removeWriter(writer) {
    const w = this.writers;
    const index = w.indexOf(writer);

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
   * @returns {Acl} Acl
   */
  removeWriterGroup(group) {
    const groups = this.writerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.entity._acl.groups = Object.assign(this.entity._acl.groups, { w: groups });
    return this;
  }
}
