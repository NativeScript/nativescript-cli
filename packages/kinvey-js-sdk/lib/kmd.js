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
 * This class provides a way to access the KMD (Kinvey Metadata)
 * information for an entity.
 */
var Kmd = function () {
  function Kmd() {
    var kmd = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Kmd);

    if (!(0, _isPlainObject2.default)(kmd)) {
      throw new Error('kmd must be a plain object.');
    }

    /**
     * @private
     */
    this.kmd = kmd;
  }

  /**
   * Get the auth token.
   *
   * @returns {string} _kmd.authtoken
   */


  _createClass(Kmd, [{
    key: 'isEmailConfirmed',


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
    key: 'isLocal',
    value: function isLocal() {
      return this.kmd.local === true;
    }
  }, {
    key: 'authtoken',
    get: function get() {
      return this.kmd.authtoken;
    }

    /**
     * Get created at time.
     *
     * @returns {Date?} _kmd.ect
     */

  }, {
    key: 'ect',
    get: function get() {
      return this.createdAt;
    }

    /**
     * Get created at time.
     *
     * @returns {Date?} _kmd.ect
     */

  }, {
    key: 'createdAt',
    get: function get() {
      if (this.kmd.ect) {
        return new Date(this.kmd.ect);
      }

      return undefined;
    }

    /**
     * Get last modified time.
     *
     * @returns {Date?} _kmd.lmt
     */

  }, {
    key: 'lmt',
    get: function get() {
      return this.updatedAt;
    }

    /**
     * Get last modified time.
     *
     * @returns {Date?} _kmd.lmt
     */

  }, {
    key: 'lastModified',
    get: function get() {
      return this.updatedAt;
    }

    /**
     * Get last modified time.
     *
     * @returns {Date?} _kmd.lmt
     */

  }, {
    key: 'updatedAt',
    get: function get() {
      if (this.kmd.lmt) {
        return new Date(this.kmd.lmt);
      }

      return undefined;
    }

    /**
     * Get the email verification details.
     *
     * @returns {Object} _kmd.emailVerification
     */

  }, {
    key: 'emailVerification',
    get: function get() {
      return this.kmd.emailVerification;
    }
  }]);

  return Kmd;
}();

exports.default = Kmd;