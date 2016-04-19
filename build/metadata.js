'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Metadata = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

/**
 * Wrapper for accessing the `_kmd` properties of an entity.
 */

var Metadata = exports.Metadata = function () {
  function Metadata() {
    var entity = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Metadata);

    if (!(0, _isPlainObject2.default)(entity)) {
      throw new _errors.KinveyError('entity argument must be an object');
    }

    /**
     * The kmd properties.
     *
     * @private
     * @type {Object}
     */
    this.kmd = entity[kmdAttribute] || {};

    /**
     * The entity.
     *
     * @private
     * @type {Object}
     */
    this.entity = entity;
  }

  _createClass(Metadata, [{
    key: 'isLocal',
    value: function isLocal() {
      return !!this.kmd.local;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this.kmd;
    }
  }, {
    key: 'createdAt',
    get: function get() {
      if (this.kmd.ect) {
        return Date.parse(this.kmd.ect);
      }

      return undefined;
    }
  }, {
    key: 'emailVerification',
    get: function get() {
      return this.kmd.emailVerification.status;
    }
  }, {
    key: 'lastModified',
    get: function get() {
      if (this.kmd.lmt) {
        return Date.parse(this.kmd.lmt);
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
    },
    set: function set(authtoken) {
      this.kmd.authtoken = authtoken;
    }
  }]);

  return Metadata;
}();