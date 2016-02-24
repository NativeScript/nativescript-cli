import { KinveyError } from './errors';
import isPlainObject from 'lodash/isPlainObject';
import clone from 'lodash/clone';
const aclAttribute = process.env.KINVEY_ACL_ATTRIBUTE || '_acl';
const privateAclSymbol = Symbol();

/**
 * @private
 */
class PrivateAcl {
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
    this.acl = entity[aclAttribute];
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
    return clone(this.acl, true);
  }
}

/**
 * Wrapper for reading and setting permissions on an entity level.
 *
 * @example
 * var entity = { _acl: {} };
 * var acl = new Kinvey.Acl(entity);
 */
export default class Acl {
  constructor(acl) {
    this[privateAclSymbol] = new PrivateAcl(acl);
  }

  /**
   * Returns the user id of the user that originally created the entity.
   *
   * @returns {?string} The user id, or `null` if not set.
   */
  get creator() {
    return this[privateAclSymbol].creator;
  }

  /**
   * Returns the list of users that are explicitly allowed to read the entity.
   *
   * @returns {Array} The list of users.
   */
  get readers() {
    return this[privateAclSymbol].readers;
  }

  /**
   * Returns the list of user groups that are explicitly allowed to read the
   * entity.
   *
   * @returns {Array} The list of user groups.
   */
  get readerGroups() {
    return this[privateAclSymbol].readerGroups;
  }

  /**
   * Returns the list of user groups that are explicitly allowed to read the
   * entity.
   *
   * @returns {Array} The list of user groups.
   */
  get writerGroups() {
    return this[privateAclSymbol].writerGroups;
  }

  /**
   * Returns the list of users that are explicitly allowed to modify the
   * entity.
   *
   * @returns {Array} The list of users.
   */
  get writers() {
    return this[privateAclSymbol].writers;
  }

  /**
   * Specifies whether the entity is globally readable.
   *
   * @param {boolean} [gr=true] Make the entity globally readable.
   */
  set globallyReadable(gr) {
    this[privateAclSymbol].globallyReadable = gr;
  }

  /**
   * Specifies whether the entity is globally writable.
   *
   * @param {boolean} [gw=true] Make the entity globally writable.
   */
  set globallyWritable(gw) {
    this[privateAclSymbol].globallyWritable = gw;
  }

  /**
   * Adds a user to the list of users that are explicitly allowed to read the
   * entity.
   *
   * @param   {string}  user  The user id.
   * @returns {Acl}           The ACL.
   */
  addReader(user) {
    this[privateAclSymbol].addReader(user);
    return this;
  }

  /**
   * Adds a user group to the list of user groups that are explicitly allowed
   * to read the entity.
   *
   * @param   {string}  group   The group id.
   * @returns {Acl}             The ACL.
   */
  addReaderGroup(group) {
    this[privateAclSymbol].addReaderGroup(group);
    return this;
  }

  /**
   * Adds a user to the list of users that are explicitly allowed to modify the
   * entity.
   *
   * @param   {string}  user    The user id.
   * @returns {Acl}             The ACL.
   */
  addWriter(user) {
    this[privateAclSymbol].addWriter(user);
    return this;
  }

  /**
   * Adds a user group to the list of user groups that are explicitly allowed
   * to modify the entity.
   *
   * @param   {string}  group   The group id.
   * @returns {Acl}             The ACL.
   */
  addWriterGroup(group) {
    this[privateAclSymbol].addWriterGroup(group);
    return this;
  }

  /**
   * Returns whether the entity is globally readable.
   *
   * @returns {boolean}
   */
  isGloballyReadable() {
    return this[privateAclSymbol].isGloballyReadable();
  }

  /**
   * Returns whether the entity is globally writable.
   *
   * @returns {boolean}
   */
  isGloballyWritable() {
    return this[privateAclSymbol].isGloballyWritable();
  }

  /**
   * Removes a user from the list of users that are explicitly allowed to read
   * the entity.
   *
   * @param   {string}  user    The user id.
   * @returns {Acl}             The ACL.
   */
  removeReader(user) {
    this[privateAclSymbol].removeReader(user);
    return this;
  }

  /**
   * Removes a user group from the list of user groups that are explicitly
   * allowed to read the entity.
   *
   * @param   {string}  group   The group id.
   * @returns {Acl}             The ACL.
   */
  removeReaderGroup(group) {
    this[privateAclSymbol].removeReaderGroup(group);
    return this;
  }

  /**
   * Removes a user from the list of users that are explicitly allowed to
   * modify the entity.
   *
   * @param   {string}  user    The user id.
   * @returns {Acl}             The ACL.
   */
  removeWriter(user) {
    this[privateAclSymbol].removeWriter(user);
    return this;
  }

  /**
   * Removes a user group from the list of user groups that are explicitly
   * allowed to modify the entity.
   *
   * @param   {string}  group   The group id.
   * @returns {Acl}             The ACL.
   */
  removeWriterGroup(group) {
    this[privateAclSymbol].removeWriterGroup(group);
    return this;
  }

  /**
   * Returns JSON representation of the entity ACL.
   *
   * @returns {Object} The entity ACL.
   */
  toJSON() {
    return this[privateAclSymbol].toJSON();
  }
}
