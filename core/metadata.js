'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
var privateMetadataSymbol = Symbol();

/**
 * @private
 */

var PrivateMetadata = function () {
  function PrivateMetadata() {
    var entity = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, PrivateMetadata);

    if (!(0, _isPlainObject2.default)(entity)) {
      throw new _errors.KinveyError('entity argument must be an object');
    }

    /**
     * The kmd properties.
     *
     * @private
     * @type {Object}
     */
    this.kmd = entity[kmdAttribute];

    /**
     * The entity.
     *
     * @private
     * @type {Object}
     */
    this.entity = entity;
  }

  _createClass(PrivateMetadata, [{
    key: 'toJSON',
    value: function toJSON() {
      return (0, _clone2.default)(this.kmd, true);
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
    key: 'authtoken',
    get: function get() {
      return this.kmd.authtoken;
    },
    set: function set(authtoken) {
      this.kmd.authtoken = authtoken;
    }
  }]);

  return PrivateMetadata;
}();

/**
 * Wrapper for accessing the `_kmd` properties of an entity.
 */


var Metadata = function () {
  function Metadata(entity) {
    _classCallCheck(this, Metadata);

    this[privateMetadataSymbol] = new PrivateMetadata(entity);
  }

  /**
   * Returns the date when the entity was created.
   *
   * @returns {?Date} Created at date, or `null` if not set.
   */


  _createClass(Metadata, [{
    key: 'toJSON',


    /**
     * Returns JSON representation of the entity.
     *
     * @returns {Object} The metadata.
     */
    value: function toJSON() {
      return this[privateMetadataSymbol].toJSON();
    }
  }, {
    key: 'createdAt',
    get: function get() {
      return this[privateMetadataSymbol].createdAt;
    }

    /**
    * Returns the email verification status.
    *
    * @returns {?Object} The email verification status, or `null` if not set.
    */

  }, {
    key: 'emailVerification',
    get: function get() {
      return this[privateMetadataSymbol].emailVerification;
    }

    /**
     * Returns the date when the entity was last modified.
     *
     * @returns {?Date} Last modified date, or `null` if not set.
     */

  }, {
    key: 'lastModified',
    get: function get() {
      return this[privateMetadataSymbol].lastModified;
    }
  }, {
    key: 'lmt',
    get: function get() {
      return this.lastModified;
    }
  }, {
    key: 'authtoken',
    get: function get() {
      return this[privateMetadataSymbol].authtoken;
    },
    set: function set(authtoken) {
      this[privateMetadataSymbol].authtoken = authtoken;
    }
  }]);

  return Metadata;
}();

exports.default = Metadata;