'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../errors');

var _utils = require('../../utils');

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Metadata = function () {
  function Metadata(entity) {
    _classCallCheck(this, Metadata);

    if ((0, _isPlainObject2.default)(entity) === false) {
      throw new _errors.KinveyError('entity argument must be an object');
    }

    entity._kmd = entity._kmd || {};
    this.entity = entity;
  }

  _createClass(Metadata, [{
    key: 'isLocal',
    value: function isLocal() {
      return this.entity._kmd.local === true;
    }
  }, {
    key: 'toPlainObject',
    value: function toPlainObject() {
      return this.entity._kmd;
    }
  }, {
    key: 'createdAt',
    get: function get() {
      if (this.entity._kmd.ect) {
        return new Date(this.entity._kmd.ect);
      }

      return undefined;
    }
  }, {
    key: 'ect',
    get: function get() {
      return this.createdAt;
    }
  }, {
    key: 'emailVerification',
    get: function get() {
      if ((0, _utils.isDefined)(this.entity._kmd.emailVerification)) {
        return this.entity._kmd.emailVerification.status;
      }

      return undefined;
    }
  }, {
    key: 'lastModified',
    get: function get() {
      if (this.entity._kmd.lmt) {
        return new Date(this.entity._kmd.lmt);
      }

      return undefined;
    }
  }, {
    key: 'lmt',
    get: function get() {
      return this.lastModified;
    }
  }, {
    key: 'authtoken',
    get: function get() {
      return this.entity._kmd.authtoken;
    }
  }]);

  return Metadata;
}();

exports.default = Metadata;