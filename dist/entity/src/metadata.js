'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../errors');

var _utils = require('../../utils');

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var kmdAttribute = process && process.env && process.env.KINVEY_KMD_ATTRIBUTE || '_kmd' || '_kmd';

var Metadata = function () {
  function Metadata() {
    var entity = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Metadata);

    if (!(0, _isPlainObject2.default)(entity)) {
      throw new _errors.KinveyError('entity argument must be an object');
    }

    this.kmd = (0, _clone2.default)(entity[kmdAttribute] || {});
  }

  _createClass(Metadata, [{
    key: 'isLocal',
    value: function isLocal() {
      return !!this.kmd.local;
    }
  }, {
    key: 'toPlainObject',
    value: function toPlainObject() {
      return this.kmd;
    }
  }, {
    key: 'createdAt',
    get: function get() {
      if (this.kmd.ect) {
        return new Date(this.kmd.ect);
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
      if ((0, _utils.isDefined)(this.kmd.emailVerification)) {
        return this.kmd.emailVerification.status;
      }

      return undefined;
    }
  }, {
    key: 'lastModified',
    get: function get() {
      if (this.kmd.lmt) {
        return new Date(this.kmd.lmt);
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
      return this.kmd.authtoken;
    }
  }]);

  return Metadata;
}();

exports.default = Metadata;