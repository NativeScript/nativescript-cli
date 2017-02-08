'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../errors');

var _utils = require('../../utils');

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Acl = function () {
  function Acl(entity) {
    _classCallCheck(this, Acl);

    if ((0, _isPlainObject2.default)(entity) === false) {
      throw new _errors.KinveyError('entity argument must be an object');
    }

    entity._acl = entity._acl || {};
    this.entity = entity;
  }

  _createClass(Acl, [{
    key: 'addReader',
    value: function addReader(user) {
      var r = this.readers;

      if (r.indexOf(user) === -1) {
        r.push(user);
      }

      this.entity._acl.r = r;
      return this;
    }
  }, {
    key: 'addReaderGroup',
    value: function addReaderGroup(group) {
      var groups = this.readerGroups;

      if (groups.indexOf(group) === -1) {
        groups.push(group);
      }

      this.entity._acl.groups = (0, _assign2.default)({}, this.entity._acl.groups, { r: groups });
      return this;
    }
  }, {
    key: 'addWriter',
    value: function addWriter(user) {
      var w = this.writers;

      if (w.indexOf(user) === -1) {
        w.push(user);
      }

      this.entity._acl.w = w;
      return this;
    }
  }, {
    key: 'addWriterGroup',
    value: function addWriterGroup(group) {
      var groups = this.writerGroups;

      if (groups.indexOf(group) === -1) {
        groups.push(group);
      }

      this.entity._acl.groups = (0, _assign2.default)({}, this.entity._acl.groups, { w: groups });
      return this;
    }
  }, {
    key: 'isGloballyReadable',
    value: function isGloballyReadable() {
      if (this.entity._acl.gr === true) {
        return this.entity._acl.gr;
      }

      return false;
    }
  }, {
    key: 'isGloballyWritable',
    value: function isGloballyWritable() {
      if (this.entity._acl.gw === true) {
        return this.entity._acl.gw;
      }

      return false;
    }
  }, {
    key: 'removeReader',
    value: function removeReader(user) {
      var r = this.readers;
      var index = r.indexOf(user);

      if (index !== -1) {
        r.splice(index, 1);
      }

      this.entity._acl.r = r;
      return this;
    }
  }, {
    key: 'removeReaderGroup',
    value: function removeReaderGroup(group) {
      var groups = this.readerGroups;
      var index = groups.indexOf(group);

      if (index !== -1) {
        groups.splice(index, 1);
      }

      this.entity._acl.groups = (0, _assign2.default)({}, this.entity._acl.groups, { r: groups });
      return this;
    }
  }, {
    key: 'removeWriter',
    value: function removeWriter(user) {
      var w = this.writers;
      var index = w.indexOf(user);

      if (index !== -1) {
        w.splice(index, 1);
      }

      this.entity._acl.w = w;
      return this;
    }
  }, {
    key: 'removeWriterGroup',
    value: function removeWriterGroup(group) {
      var groups = this.writerGroups;
      var index = groups.indexOf(group);

      if (index !== -1) {
        groups.splice(index, 1);
      }

      this.entity._acl.groups = (0, _assign2.default)({}, this.entity._acl.groups, { w: groups });
      return this;
    }
  }, {
    key: 'toPlainObject',
    value: function toPlainObject() {
      return this.entity._acl;
    }
  }, {
    key: 'creator',
    get: function get() {
      return this.entity._acl.creator;
    }
  }, {
    key: 'readers',
    get: function get() {
      return (0, _isArray2.default)(this.entity._acl.r) ? this.entity._acl.r : [];
    }
  }, {
    key: 'writers',
    get: function get() {
      return (0, _isArray2.default)(this.entity._acl.w) ? this.entity._acl.w : [];
    }
  }, {
    key: 'readerGroups',
    get: function get() {
      return (0, _utils.isDefined)(this.entity._acl.groups) && (0, _isArray2.default)(this.entity._acl.groups.r) ? this.entity._acl.groups.r : [];
    }
  }, {
    key: 'writerGroups',
    get: function get() {
      return (0, _utils.isDefined)(this.entity._acl.groups) && (0, _isArray2.default)(this.entity._acl.groups.w) ? this.entity._acl.groups.w : [];
    }
  }, {
    key: 'globallyReadable',
    set: function set(gr) {
      if (gr === true) {
        this.entity._acl.gr = gr;
      } else {
        this.entity._acl.gr = false;
      }
    }
  }, {
    key: 'globallyWritable',
    set: function set(gw) {
      if (gw === true) {
        this.entity._acl.gw = gw;
      } else {
        this.entity._acl.gw = false;
      }
    }
  }]);

  return Acl;
}();

exports.default = Acl;