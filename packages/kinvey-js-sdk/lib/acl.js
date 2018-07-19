'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This class provides a way to access the ACL (Access Control List)
 * information for an entity and to modify the access control permissions.
 */
var Acl = function () {
  function Acl() {
    var acl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Acl);

    if (!(0, _isPlainObject2.default)(acl)) {
      throw new Error('acl must be a plain object.');
    }

    this.acl = acl;
  }

  /**
   * Get the creator.
   *
   * @returns {string} Creator
   */


  _createClass(Acl, [{
    key: 'addReader',


    /**
     * Add a reader.
     *
     * @param {string} reader Reader
     * @returns {Acl} Acl
     */
    value: function addReader(reader) {
      var r = this.readers;

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

  }, {
    key: 'addReaderGroup',
    value: function addReaderGroup(group) {
      var groups = this.readerGroups;

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

  }, {
    key: 'addWriter',
    value: function addWriter(writer) {
      var w = this.writers;

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

  }, {
    key: 'addWriterGroup',
    value: function addWriterGroup(group) {
      var groups = this.writerGroups;

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

  }, {
    key: 'isGloballyReadable',
    value: function isGloballyReadable() {
      return this.acl.gr === true;
    }

    /**
     * Check if globally writable is allowed.
     *
     * @returns {boolean} True if globally writable is allowed otherwise false
     */

  }, {
    key: 'isGloballyWritable',
    value: function isGloballyWritable() {
      return this.acl.gw === true;
    }

    /**
     * Remove a reader.
     *
     * @param {string} reader Reader
     * @returns {Acl} Acl
     */

  }, {
    key: 'removeReader',
    value: function removeReader(reader) {
      var r = this.readers;
      var index = r.indexOf(reader);

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

  }, {
    key: 'removeReaderGroup',
    value: function removeReaderGroup(group) {
      var groups = this.readerGroups;
      var index = groups.indexOf(group);

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

  }, {
    key: 'removeWriter',
    value: function removeWriter(writer) {
      var w = this.writers;
      var index = w.indexOf(writer);

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

  }, {
    key: 'removeWriterGroup',
    value: function removeWriterGroup(group) {
      var groups = this.writerGroups;
      var index = groups.indexOf(group);

      if (index !== -1) {
        groups.splice(index, 1);
      }

      this.acl.groups = Object.assign(this.acl.groups, { w: groups });
      return this;
    }
  }, {
    key: 'creator',
    get: function get() {
      return this.acl.creator;
    }

    /**
     * Get the readers.
     *
     * @returns {string[]} Readers
     */

  }, {
    key: 'readers',
    get: function get() {
      return Array.isArray(this.acl.r) ? this.acl.r : [];
    }

    /**
     * Get the writers.
     *
     * @returns {string[]} Writers
     */

  }, {
    key: 'writers',
    get: function get() {
      return Array.isArray(this.acl.w) ? this.acl.w : [];
    }

    /**
     * Get the reader groups.
     *
     * @returns {string[]} Reader groups
     */

  }, {
    key: 'readerGroups',
    get: function get() {
      return this.acl.groups && Array.isArray(this.acl.groups.r) ? this.acl.groups.r : [];
    }

    /**
     * Get the writer groups.
     *
     * @returns {string[]} Writer groups
     */

  }, {
    key: 'writerGroups',
    get: function get() {
      return this.acl.groups && Array.isArray(this.acl.groups.w) ? this.acl.groups.w : [];
    }

    /**
     * Set the globally readable permission.
     *
     * @param {boolean} gr Globally readable
     */

  }, {
    key: 'globallyReadable',
    set: function set(gr) {
      this.acl.gr = gr === true;
    }

    /**
     * Set the globally writable permission.
     *
     * @param {boolean} gw Globally writable
     */

  }, {
    key: 'globallyWritable',
    set: function set(gw) {
      this.acl.gw = gw === true;
    }
  }]);

  return Acl;
}();

exports.default = Acl;