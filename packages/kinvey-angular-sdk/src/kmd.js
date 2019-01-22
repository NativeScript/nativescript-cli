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
 * This class provides a way to access the KMD (Kinvey Metadata)
 * information for an entity.
 */
var Kmd =
/*#__PURE__*/
function () {
  function Kmd(entity) {
    (0, _classCallCheck2.default)(this, Kmd);

    if (!(0, _isPlainObject.default)(entity)) {
      throw new _kinvey.default('entity argument must be an object');
    }

    entity._kmd = entity._kmd || {}; // eslint-disable-line no-param-reassign

    this.entity = entity;
  }
  /**
   * Get the auth token.
   *
   * @returns {string} _kmd.authtoken
   */


  (0, _createClass2.default)(Kmd, [{
    key: "isEmailConfirmed",

    /**
     * Checks if an email for a user has been confirmed.
     *
     * @returns {boolean} True if the email has been confirmed otherwise false
     */
    value: function isEmailConfirmed() {
      if (this.emailVerification) {
        return this.emailVerification.status === 'confirmed';
      }

      return false;
    }
    /**
     * Checks if the entity has been created locally.
     *
     * @returns {boolean} True if the entity has been created locally otherwise false
     */

  }, {
    key: "isLocal",
    value: function isLocal() {
      return this.entity._kmd.local === true;
    }
  }, {
    key: "toPlainObject",
    value: function toPlainObject() {
      return this.entity._kmd;
    }
  }, {
    key: "authtoken",
    get: function get() {
      return this.entity._kmd.authtoken;
    }
    /**
     * Get created at time.
     *
     * @returns {Date?} _kmd.ect
     */

  }, {
    key: "ect",
    get: function get() {
      return this.createdAt;
    }
    /**
     * Get created at time.
     *
     * @returns {Date?} _kmd.ect
     */

  }, {
    key: "createdAt",
    get: function get() {
      if (this.entity._kmd.ect) {
        return new Date(this.entity._kmd.ect);
      }

      return undefined;
    }
    /**
     * Get last modified time.
     *
     * @returns {Date?} _kmd.lmt
     */

  }, {
    key: "lmt",
    get: function get() {
      return this.updatedAt;
    }
    /**
     * Get last modified time.
     *
     * @returns {Date?} _kmd.lmt
     */

  }, {
    key: "lastModified",
    get: function get() {
      return this.updatedAt;
    }
    /**
     * Get last modified time.
     *
     * @returns {Date?} _kmd.lmt
     */

  }, {
    key: "updatedAt",
    get: function get() {
      if (this.entity._kmd.lmt) {
        return new Date(this.entity._kmd.lmt);
      }

      return undefined;
    }
    /**
     * Get the email verification details.
     *
     * @returns {Object} _kmd.emailVerification
     */

  }, {
    key: "emailVerification",
    get: function get() {
      if (this.entity._kmd.emailVerification) {
        return this.entity._kmd.emailVerification.status;
      }

      return undefined;
    }
  }]);
  return Kmd;
}();

exports.default = Kmd;