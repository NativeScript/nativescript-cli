'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Acl = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var aclAttribute = '_acl' || '_acl';

/**
 * Wrapper for reading and setting permissions on an entity level.
 *
 * @example
 * var entity = { _acl: {} };
 * var acl = new Kinvey.Acl(entity);
 */

var Acl = exports.Acl = function () {
  function Acl() {
    var entity = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Acl);

    if (!(0, _isPlainObject2.default)(entity)) {
      throw new _errors.KinveyError('entity argument must be an object');
    }

    /**
     * The kmd properties.
     *
     * @private
     * @type {Object}
     */
    this.acl = entity[aclAttribute];
  }

  _createClass(Acl, [{
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
      return this.acl;
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

  return Acl;
}();