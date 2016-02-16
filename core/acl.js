'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var privateAclSymbol = Symbol();

/**
 * @private
 */

var PrivateAcl = function () {
  function PrivateAcl() {
    var acl = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, PrivateAcl);

    if (!(0, _isPlainObject2.default)(acl)) {
      throw new _errors.KinveyError('acl argument must be an object');
    }

    /**
     * The acl properties.
     *
     * @private
     * @type {Object}
     */
    this.acl = acl;
  }

  _createClass(PrivateAcl, [{
    key: 'addReader',
    value: function addReader(user) {
      var r = this.acl.r || [];

      if (r.indexOf(user) === -1) {
        r.push(user);
      }

      this.acl.r = r;
      return this;
    }
  }, {
    key: 'addReaderGroup',
    value: function addReaderGroup(group) {
      var groups = this.acl.groups || {};
      var r = groups.r || [];

      if (r.indexOf(group) === -1) {
        r.push(group);
      }

      groups.r = r;
      this.acl.groups = groups;
      return this;
    }
  }, {
    key: 'addWriter',
    value: function addWriter(user) {
      var w = this.acl.w || [];

      if (w.indexOf(user) === -1) {
        w.push(user);
      }

      this.acl.w = w;
      return this;
    }
  }, {
    key: 'addWriterGroup',
    value: function addWriterGroup(group) {
      var groups = this.acl.groups || {};
      var w = groups.w || [];

      if (w.indexOf(group) === -1) {
        w.push(group);
      }

      groups.w = w;
      this.acl.groups = groups;
      return this;
    }
  }, {
    key: 'isGloballyReadable',
    value: function isGloballyReadable() {
      return this.acl.gr || false;
    }
  }, {
    key: 'isGloballyWritable',
    value: function isGloballyWritable() {
      return this.acl.gw || false;
    }
  }, {
    key: 'removeReader',
    value: function removeReader(user) {
      var r = this.acl.r || [];
      var pos = r.indexOf(user);

      if (pos !== -1) {
        r.splice(pos, 1);
      }

      this.acl.r = r;
      return this;
    }
  }, {
    key: 'removeReaderGroup',
    value: function removeReaderGroup(group) {
      var groups = this.acl.groups || {};
      var r = groups.r || [];
      var pos = r.indexOf(group);

      if (pos !== -1) {
        r.splice(pos, 1);
      }

      groups.r = r;
      this.acl.groups = groups;
      return this;
    }
  }, {
    key: 'removeWriter',
    value: function removeWriter(user) {
      var w = this.acl.w || [];
      var pos = w.indexOf(user);

      if (pos !== -1) {
        w.splice(pos, 1);
      }

      this.acl.w = w;
      return this;
    }
  }, {
    key: 'removeWriterGroup',
    value: function removeWriterGroup(group) {
      var groups = this.acl.groups || {};
      var w = groups.w || [];
      var pos = w.indexOf(group);

      if (pos !== -1) {
        w.splice(pos, 1);
      }

      groups.w = w;
      this.acl.groups = groups;
      return this;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return (0, _clone2.default)(this.acl);
    }
  }, {
    key: 'creator',
    get: function get() {
      return this.acl.creator;
    }
  }, {
    key: 'readers',
    get: function get() {
      return this.acl.r || [];
    }
  }, {
    key: 'writers',
    get: function get() {
      return this.acl.w || [];
    }
  }, {
    key: 'readerGroups',
    get: function get() {
      return this.acl.groups ? this.acl.groups.r : [];
    }
  }, {
    key: 'writerGroups',
    get: function get() {
      return this.acl.groups ? this.acl.groups.w : [];
    }
  }, {
    key: 'globallyReadable',
    set: function set(gr) {
      this.acl.gr = gr || false;
    }
  }, {
    key: 'globallyWritable',
    set: function set(gw) {
      this.acl.gw = gw || false;
    }
  }]);

  return PrivateAcl;
}();

/**
 * Wrapper for reading and setting permissions on an entity level.
 *
 * @example
 * var entity = { _acl: {} };
 * var acl = new Kinvey.Acl(entity);
 */


var Acl = function () {
  function Acl(acl) {
    _classCallCheck(this, Acl);

    this[privateAclSymbol] = new PrivateAcl(acl);
  }

  /**
   * Returns the user id of the user that originally created the entity.
   *
   * @returns {?string} The user id, or `null` if not set.
   */


  _createClass(Acl, [{
    key: 'addReader',


    /**
     * Adds a user to the list of users that are explicitly allowed to read the
     * entity.
     *
     * @param   {string}  user  The user id.
     * @returns {Acl}           The ACL.
     */
    value: function addReader(user) {
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

  }, {
    key: 'addReaderGroup',
    value: function addReaderGroup(group) {
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

  }, {
    key: 'addWriter',
    value: function addWriter(user) {
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

  }, {
    key: 'addWriterGroup',
    value: function addWriterGroup(group) {
      this[privateAclSymbol].addWriterGroup(group);
      return this;
    }

    /**
     * Returns whether the entity is globally readable.
     *
     * @returns {boolean}
     */

  }, {
    key: 'isGloballyReadable',
    value: function isGloballyReadable() {
      return this[privateAclSymbol].isGloballyReadable();
    }

    /**
     * Returns whether the entity is globally writable.
     *
     * @returns {boolean}
     */

  }, {
    key: 'isGloballyWritable',
    value: function isGloballyWritable() {
      return this[privateAclSymbol].isGloballyWritable();
    }

    /**
     * Removes a user from the list of users that are explicitly allowed to read
     * the entity.
     *
     * @param   {string}  user    The user id.
     * @returns {Acl}             The ACL.
     */

  }, {
    key: 'removeReader',
    value: function removeReader(user) {
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

  }, {
    key: 'removeReaderGroup',
    value: function removeReaderGroup(group) {
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

  }, {
    key: 'removeWriter',
    value: function removeWriter(user) {
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

  }, {
    key: 'removeWriterGroup',
    value: function removeWriterGroup(group) {
      this[privateAclSymbol].removeWriterGroup(group);
      return this;
    }

    /**
     * Returns JSON representation of the entity ACL.
     *
     * @returns {Object} The entity ACL.
     */

  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this[privateAclSymbol].toJSON();
    }
  }, {
    key: 'creator',
    get: function get() {
      return this[privateAclSymbol].creator;
    }

    /**
     * Returns the list of users that are explicitly allowed to read the entity.
     *
     * @returns {Array} The list of users.
     */

  }, {
    key: 'readers',
    get: function get() {
      return this[privateAclSymbol].readers;
    }

    /**
     * Returns the list of user groups that are explicitly allowed to read the
     * entity.
     *
     * @returns {Array} The list of user groups.
     */

  }, {
    key: 'readerGroups',
    get: function get() {
      return this[privateAclSymbol].readerGroups;
    }

    /**
     * Returns the list of user groups that are explicitly allowed to read the
     * entity.
     *
     * @returns {Array} The list of user groups.
     */

  }, {
    key: 'writerGroups',
    get: function get() {
      return this[privateAclSymbol].writerGroups;
    }

    /**
     * Returns the list of users that are explicitly allowed to modify the
     * entity.
     *
     * @returns {Array} The list of users.
     */

  }, {
    key: 'writers',
    get: function get() {
      return this[privateAclSymbol].writers;
    }

    /**
     * Specifies whether the entity is globally readable.
     *
     * @param {boolean} [gr=true] Make the entity globally readable.
     */

  }, {
    key: 'globallyReadable',
    set: function set(gr) {
      this[privateAclSymbol].globallyReadable = gr;
    }

    /**
     * Specifies whether the entity is globally writable.
     *
     * @param {boolean} [gw=true] Make the entity globally writable.
     */

  }, {
    key: 'globallyWritable',
    set: function set(gw) {
      this[privateAclSymbol].globallyWritable = gw;
    }
  }]);

  return Acl;
}();

exports.default = Acl;