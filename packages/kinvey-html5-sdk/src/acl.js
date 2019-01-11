"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _isPlainObject = _interopRequireDefault(require("lodash/isPlainObject"));

var _kinvey = _interopRequireDefault(require("./errors/kinvey"));

/**
 * This class provides a way to access the ACL (Access Control List)
 * information for an entity and to modify the access control permissions.
 */
var Acl =
/*#__PURE__*/
function () {
  function Acl(entity) {
    (0, _classCallCheck2.default)(this, Acl);

    if (!(0, _isPlainObject.default)(entity)) {
      throw new _kinvey.default('entity must be an object.');
    }

    entity._acl = entity._acl || {}; // eslint-disable-line no-param-reassign

    this.entity = entity;
  }
  /**
   * Get the creator.
   *
   * @returns {string} Creator
   */


  (0, _createClass2.default)(Acl, [{
    key: "addReader",

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

      this.entity._acl.r = r;
      return this;
    }
    /**
     * Add a reader group.
     *
     * @param {string} group Reader group
     * @returns {Acl} Acl
     */

  }, {
    key: "addReaderGroup",
    value: function addReaderGroup(group) {
      var groups = this.readerGroups;

      if (groups.indexOf(group) === -1) {
        groups.push(group);
      }

      this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, {
        r: groups
      });
      return this;
    }
    /**
     * Add a writer.
     *
     * @param {string} writer Writer
     * @returns {Acl} Acl
     */

  }, {
    key: "addWriter",
    value: function addWriter(writer) {
      var w = this.writers;

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

  }, {
    key: "addWriterGroup",
    value: function addWriterGroup(group) {
      var groups = this.writerGroups;

      if (groups.indexOf(group) === -1) {
        groups.push(group);
      }

      this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, {
        w: groups
      });
      return this;
    }
    /**
     * Check if globally readable is allowed.
     *
     * @returns {boolean} True if globally readable is allowed otherwise false
     */

  }, {
    key: "isGloballyReadable",
    value: function isGloballyReadable() {
      return this.entity._acl.gr === true;
    }
    /**
     * Check if globally writable is allowed.
     *
     * @returns {boolean} True if globally writable is allowed otherwise false
     */

  }, {
    key: "isGloballyWritable",
    value: function isGloballyWritable() {
      return this.entity._acl.gw === true;
    }
    /**
     * Remove a reader.
     *
     * @param {string} reader Reader
     * @returns {Acl} Acl
     */

  }, {
    key: "removeReader",
    value: function removeReader(reader) {
      var r = this.readers;
      var index = r.indexOf(reader);

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

  }, {
    key: "removeReaderGroup",
    value: function removeReaderGroup(group) {
      var groups = this.readerGroups;
      var index = groups.indexOf(group);

      if (index !== -1) {
        groups.splice(index, 1);
      }

      this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, {
        r: groups
      });
      return this;
    }
    /**
     * Remove a writer.
     *
     * @param {string} writer Writer
     * @returns {Acl} Acl
     */

  }, {
    key: "removeWriter",
    value: function removeWriter(writer) {
      var w = this.writers;
      var index = w.indexOf(writer);

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

  }, {
    key: "removeWriterGroup",
    value: function removeWriterGroup(group) {
      var groups = this.writerGroups;
      var index = groups.indexOf(group);

      if (index !== -1) {
        groups.splice(index, 1);
      }

      this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, {
        w: groups
      });
      return this;
    }
    /**
     * The acl as a plain object.
     *
     * @returns {Object} Acl as a plain object.
     */

  }, {
    key: "toPlainObject",
    value: function toPlainObject() {
      return this.entity._acl;
    }
  }, {
    key: "creator",
    get: function get() {
      return this.entity._acl.creator;
    }
    /**
     * Get the readers.
     *
     * @returns {string[]} Readers
     */

  }, {
    key: "readers",
    get: function get() {
      return Array.isArray(this.entity._acl.r) ? this.entity._acl.r : [];
    }
    /**
     * Get the writers.
     *
     * @returns {string[]} Writers
     */

  }, {
    key: "writers",
    get: function get() {
      return Array.isArray(this.entity._acl.w) ? this.entity._acl.w : [];
    }
    /**
     * Get the reader groups.
     *
     * @returns {string[]} Reader groups
     */

  }, {
    key: "readerGroups",
    get: function get() {
      return this.entity._acl.groups && Array.isArray(this.entity._acl.groups.r) ? this.entity._acl.groups.r : [];
    }
    /**
     * Get the writer groups.
     *
     * @returns {string[]} Writer groups
     */

  }, {
    key: "writerGroups",
    get: function get() {
      return this.entity._acl.groups && Array.isArray(this.entity._acl.groups.w) ? this.entity._acl.groups.w : [];
    }
    /**
     * Set the globally readable permission.
     *
     * @param {boolean} gr Globally readable
     */

  }, {
    key: "globallyReadable",
    set: function set(gr) {
      this.entity._acl.gr = gr === true;
    }
    /**
     * Set the globally writable permission.
     *
     * @param {boolean} gw Globally writable
     */

  }, {
    key: "globallyWritable",
    set: function set(gw) {
      this.entity._acl.gw = gw === true;
    }
  }]);
  return Acl;
}();

exports.default = Acl;