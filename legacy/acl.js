const Acl = require('../core/acl');
const KinveyError = require('../core/errors').KinveyError;
const isPlainObject = require('lodash/isPlainObject');
const aclSymbol = Symbol();

// ACL.
// ----
//
// Wrapper for setting permissions on entity-level (i.e. entities and users).

class LegacyAcl {
  /**
 * The Kinvey.Acl class.
 *
 * @memberof! <global>
 * @class Kinvey.Acl
 * @param {Object} [document] The document.
 * @throws {Kinvey.Error} `document` must be of type: `Object`.
 */
  constructor(document = {}) {
    if (document && !isPlainObject(document)) {
      throw new KinveyError('document argument must be of type: Object.');
    }

    document._acl = document._acl || {};
    this[aclSymbol] = new Acl(document._acl);
  }

  /**
   * Adds a user to the list of users that are explicitly allowed to read the
   * document.
   *
   * @param {string} user The user id.
   * @returns {Kinvey.Acl} The ACL.
   */
  addReader(user) {
    this[aclSymbol].addReader(user);
    return this;
  }

  /**
   * Adds a user group to the list of user groups that are explicitly allowed
   * to read the document.
   *
   * @param {string} group The group id.
   * @returns {Kinvey.Acl} The ACL.
   */
  addReaderGroup(group) {
    this[aclSymbol].addReaderGroup(group);
    return this;
  }

  /**
   * Adds a user to the list of users that are explicitly allowed to modify the
   * document.
   *
   * @param {string} user The user id.
   * @returns {Kinvey.Acl} The ACL.
   */
  addWriter(user) {
    this[aclSymbol].addWriter(user);
    return this;
  }

  /**
   * Adds a user group to the list of user groups that are explicitly allowed
   * to modify the document.
   *
   * @param {string} group The group id.
   * @returns {Kinvey.Acl} The ACL.
   */
  addWriterGroup(group) {
    this[aclSymbol].addWriterGroup(group);
    return this;
  }

  /**
   * Returns the user id of the user that originally created the document.
   *
   * @returns {?string} The user id, or `null` if not set.
   */
  getCreator() {
    return this[aclSymbol].creator;
  }

  /**
   * Returns the list of users that are explicitly allowed to read the document.
   *
   * @returns {Array} The list of users.
   */
  getReaders() {
    return this[aclSymbol].readers;
  }

  /**
   * Returns the list of user groups that are explicitly allowed to read the
   * document.
   *
   * @returns {Array} The list of user groups.
   */
  getReaderGroups() {
    return this[aclSymbol].readerGroups;
  }

  /**
   * Returns the list of users that are explicitly allowed to modify the
   * document.
   *
   * @returns {Array} The list of users.
   */
  getWriters() {
    return this[aclSymbol].writers;
  }

  /**
   * Returns the list of user groups that are explicitly allowed to read the
   * document.
   *
   * @returns {Array} The list of user groups.
   */
  getWriterGroups() {
    return this[aclSymbol].writerGroups;
  }

  /**
   * Returns whether the document is globally readable.
   *
   * @returns {boolean}
   */
  isGloballyReadable() {
    return this[aclSymbol].isGloballyReadable();
  }

  /**
   * Returns whether the document is globally writable.
   *
   * @returns {boolean}
   */
  isGloballyWritable() {
    return this[aclSymbol].isGloballyWritable();
  }

  /**
   * Removes a user from the list of users that are explicitly allowed to read
   * the document.
   *
   * @param {string} user The user id.
   * @returns {Kinvey.Acl} The ACL.
   */
  removeReader(user) {
    this[aclSymbol].removeReader(user);
    return this;
  }

  /**
   * Removes a user group from the list of user groups that are explicitly
   * allowed to read the document.
   *
   * @param {string} group The group id.
   * @returns {Kinvey.Acl} The ACL.
   */
  removeReaderGroup(group) {
    this[aclSymbol].removeReaderGroup(group);
    return this;
  }

  /**
   * Removes a user from the list of users that are explicitly allowed to
   * modify the document.
   *
   * @param {string} user The user id.
   * @returns {Kinvey.Acl} The ACL.
   */
  removeWriter(user) {
    this[aclSymbol].removeWriter(user);
    return this;
  }

  /**
   * Removes a user group from the list of user groups that are explicitly
   * allowed to modify the document.
   *
   * @param {string} group The group id.
   * @returns {Kinvey.Acl} The ACL.
   */
  removeWriterGroup(group) {
    this[aclSymbol].removeWriterGroup(group);
    return this;
  }

  /**
   * Specifies whether the document is globally readable.
   *
   * @param {boolean} [gr=true] Make the document globally readable.
   * @returns {Kinvey.Acl} The ACL.
   */
  setGloballyReadable(gr) {
    this[aclSymbol].globallyReadable = gr;
    return this;
  }

  /**
   * Specifies whether the document is globally writable.
   *
   * @param {boolean} [gw=true] Make the document globally writable.
   * @returns {Kinvey.Acl}
   */
  setGloballyWritable(gw) {
    this[aclSymbol].globallyWritable = gw;
    return this;
  }

  /**
   * Returns JSON representation of the document ACL.
   *
   * @returns {Object} The document ACL.
   */
  toJSON() {
    return this[aclSymbol].toJSON();
  }
}

module.exports = LegacyAcl;
