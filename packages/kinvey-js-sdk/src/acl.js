import isPlainObject from 'lodash/isPlainObject';

/**
 * This class provides a way to access the ACL (Access Control List)
 * information for an entity and to modify the access control permissions.
 */
export default class Acl {
  constructor(acl = {}) {
    if (!isPlainObject(acl)) {
      throw new Error('acl must be a plain object.');
    }

    this.acl = acl;
  }

  /**
   * Get the creator.
   *
   * @returns {string} Creator
   */
  get creator() {
    return this.acl.creator;
  }

  /**
   * Get the readers.
   *
   * @returns {string[]} Readers
   */
  get readers() {
    return Array.isArray(this.acl.r) ? this.acl.r : [];
  }

  /**
   * Get the writers.
   *
   * @returns {string[]} Writers
   */
  get writers() {
    return Array.isArray(this.acl.w) ? this.acl.w : [];
  }

  /**
   * Get the reader groups.
   *
   * @returns {string[]} Reader groups
   */
  get readerGroups() {
    return this.acl.groups && Array.isArray(this.acl.groups.r) ? this.acl.groups.r : [];
  }

  /**
   * Get the writer groups.
   *
   * @returns {string[]} Writer groups
   */
  get writerGroups() {
    return this.acl.groups && Array.isArray(this.acl.groups.w) ? this.acl.groups.w : [];
  }

  /**
   * Set the globally readable permission.
   *
   * @param {boolean} gr Globally readable
   */
  set globallyReadable(gr) {
    this.acl.gr = gr === true;
  }

  /**
   * Set the globally writable permission.
   *
   * @param {boolean} gw Globally writable
   */
  set globallyWritable(gw) {
    this.acl.gw = gw === true;
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

    this.acl.r = r;
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

    this.acl = Object.assign(this.acl, { groups: {} });
    this.acl.groups = Object.assign(this.acl.groups, { r: groups });
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

    this.acl.w = w;
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

    this.acl = Object.assign(this.acl, { groups: {} });
    this.acl.groups = Object.assign(this.acl.groups, { w: groups });
    return this;
  }

  /**
   * Check if globally readable is allowed.
   *
   * @returns {boolean} True if globally readable is allowed otherwise false
   */
  isGloballyReadable() {
    return this.acl.gr === true;
  }

  /**
   * Check if globally writable is allowed.
   *
   * @returns {boolean} True if globally writable is allowed otherwise false
   */
  isGloballyWritable() {
    return this.acl.gw === true;
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

    this.acl.r = r;
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

    this.acl.groups = Object.assign(this.acl.groups, { r: groups });
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

    this.acl.w = w;
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

    this.acl.groups = Object.assign(this.acl.groups, { w: groups });
    return this;
  }
}
