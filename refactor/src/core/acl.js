// ACL.
// ----

// Wrapper for setting permissions on document-level (i.e. entities and users).

/**
 * The Kinvey.Acl class.
 *
 * @memberof! <global>
 * @class Kinvey.Acl
 * @param {Object} [document] The document.
 * @throws {Kinvey.Error} `document` must be of type: `Object`.
 */
Kinvey.Acl = function(document) {
  // Validate arguments.
  if(null != document && !isObject(document)) {
    throw new Kinvey.Error('document argument must be of type: Object.');
  }

  // Cast arguments.
  document      = document || {};
  document._acl = document._acl || {};

  /**
   * The ACL.
   *
   * @private
   * @type {Object}
   */
  this._acl = document._acl;
};

// Define the ACL methods.
Kinvey.Acl.prototype = /** @lends Kinvey.Acl# */{
  /**
   * Adds a user to the list of users that are explicitly allowed to read the
   * entity.
   *
   * @param {string} user The user id.
   * @returns {Kinvey.Acl} The ACL.
   */
  addReader: function(user) {
    this._acl.r = this._acl.r || [];
    if(-1 === this._acl.r.indexOf(user)) {
      this._acl.r.push(user);
    }
    return this;
  },

  /**
   * Adds a user group to the list of user groups that are explicitly allowed
   * to read the entity.
   *
   * @param {string} group The group id.
   * @returns {Kinvey.Acl} The ACL.
   */
  addReaderGroup: function(group) {
    this._acl.groups   = this._acl.groups   || {};
    this._acl.groups.r = this._acl.groups.r || [];
    if(-1 === this._acl.groups.r.indexOf(group)) {
      this._acl.groups.r.push(group);
    }
    return this;
  },

  /**
   * Adds a user group to the list of user groups that are explicitly allowed
   * to modify the entity.
   *
   * @param {string} group The group id.
   * @returns {Kinvey.Acl} The ACL.
   */
  addWriterGroup: function(group) {
    this._acl.groups   = this._acl.groups   || {};
    this._acl.groups.w = this._acl.groups.w || [];
    if(-1 === this._acl.groups.w.indexOf(group)) {
      this._acl.groups.w.push(group);
    }
    return this;
  },

  /**
   * Adds a user to the list of users that are explicitly allowed to modify the
   * entity.
   *
   * @param {string} user The user id.
   * @returns {Kinvey.Acl} The ACL.
   */
  addWriter: function(user) {
    this._acl.w = this._acl.w || [];
    if(-1 === this._acl.w.indexOf(user)) {
      this._acl.w.push(user);
    }
    return this;
  },

  /**
   * Returns the user id of the user that originally created the entity.
   *
   * @returns {?string} The user id, or `null` if not set.
   */
  getCreator: function() {
    return this._acl.creator || null;
  },

  /**
   * Returns the list of users that are explicitly allowed to read the entity.
   *
   * @returns {Array} The list of users.
   */
  getReaders: function() {
    return this._acl.r || [];
  },

  /**
   * Returns the list of user groups that are explicitly allowed to read the
   * entity.
   *
   * @returns {Array} The list of user groups.
   */
  getReaderGroups: function() {
    return this._acl.groups ? this._acl.groups.r : [];
  },

  /**
   * Returns the list of user groups that are explicitly allowed to read the
   * entity.
   *
   * @returns {Array} The list of user groups.
   */
  getWriterGroups: function() {
    return this._acl.groups ? this._acl.groups.w : [];
  },

  /**
   * Returns the list of users that are explicitly allowed to modify the
   * entity.
   *
   * @returns {Array} The list of users.
   */
  getWriters: function() {
    return this._acl.w || [];
  },

  /**
   * Returns whether the entity is globally readable.
   *
   * @returns {boolean}
   */
  isGloballyReadable: function() {
    return this._acl.gr || false;
  },

  /**
   * Returns whether the entity is globally writable.
   *
   * @returns {boolean}
   */
  isGloballyWritable: function() {
    return this._acl.gw || false;
  },

  /**
   * Removes a user from the list of users that are explicitly allowed to read
   * the entity.
   *
   * @param {string} user The user id.
   * @returns {Kinvey.Acl} The ACL.
   */
  removeReader: function(user) {
    var pos;
    if(this._acl.r && -1 !== (pos = this._acl.r.indexOf(user))) {
      this._acl.r.splice(pos, 1);
    }
    return this;
  },

  /**
   * Removes a user group from the list of user groups that are explicitly
   * allowed to read the entity.
   *
   * @param {string} group The group id.
   * @returns {Kinvey.Acl} The ACL.
   */
  removeReaderGroup: function(group) {
    var pos;
    if(this._acl.groups && this._acl.groups.r && -1 !== (pos = this._acl.groups.r.indexOf(group))) {
      this._acl.groups.r.splice(pos, 1);
    }
    return this;
  },

  /**
   * Removes a user group from the list of user groups that are explicitly
   * allowed to modify the entity.
   *
   * @param {string} group The group id.
   * @returns {Kinvey.Acl} The ACL.
   */
  removeWriterGroup: function(group) {
    var pos;
    if(this._acl.groups && this._acl.groups.w && -1 !== (pos = this._acl.groups.w.indexOf(group))) {
      this._acl.groups.w.splice(pos, 1);
    }
    return this;
  },

  /**
   * Removes a user from the list of users that are explicitly allowed to
   * modify the entity.
   *
   * @param {string} user The user id.
   * @returns {Kinvey.Acl} The ACL.
   */
  removeWriter: function(user) {
    var pos;
    if(this._acl.w && -1 !== (pos = this._acl.w.indexOf(user))) {
      this._acl.w.splice(pos, 1);
    }
    return this;
  },

  /**
   * Specifies whether the entity is globally readable.
   *
   * @param {boolean} [gr=true] Make the entity globally readable.
   * @returns {Kinvey.Acl} The ACL.
   */
  setGloballyReadable: function(gr) {
    this._acl.gr = gr || false;
    return this;
  },

  /**
   * Specifies whether the entity is globally writable.
   *
   * @param {boolean} [gw=true] Make the entity globally writable.
   * @returns {Kinvey.Acl}
   */
  setGloballyWritable: function(gw) {
    this._acl.gw = gw || false;
    return this;
  },

  /**
   * Returns JSON representation of the document ACL.
   *
   * @returns {Object} The document ACL.
   */
  toJSON: function() {
    return this._acl;
  }
};