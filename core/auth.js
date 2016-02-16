'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _user = require('./utils/user');

var _user2 = _interopRequireDefault(_user);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @private
 * Access to the Kinvey service is authenticated through user credentials,
 * Master Secret, or App Secret. A combination of these is often (but not
 * always) accepted. Therefore, an extensive set of all possible combinations
 * is gathered here and presented as authentication policies.
 */
var Auth = {
  // All policies must return a {Promise}. The value of a resolved promise must
  // be an object containing `scheme` and `username` and `password` or
  // `credentials`. The reason of rejection must be a `Kinvey.Error` constan
  // https://tools.ietf.org/html/rfc2617

  /**
   * Authenticate through (1) user credentials, (2) Master Secret, or (3) App
   * Secret.
   *
   * @returns {Promise}
   */

  all: function all() {
    var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

    return Auth.session(client).catch(function () {
      return Auth.basic(client);
    });
  },


  /**
   * Authenticate through App Secret.
   *
   * @returns {Promise}
   */
  app: function app() {
    var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

    if (!client.appKey || !client.appSecret) {
      var error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    var promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.appSecret
    });

    return promise;
  },


  /**
   * Authenticate through (1) Master Secret, or (2) App Secret.
   *
   * @returns {Promise}
   */
  basic: function basic() {
    var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

    return Auth.master(client).catch(function () {
      return Auth.app(client);
    });
  },


  /**
   * Authenticate through (1) user credentials, or (2) Master Secret.
   *
   * @returns {Promise}
   */
  default: function _default() {
    var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

    return Auth.session().catch(function (err) {
      return Auth.master(client).catch(function () {
        return Promise.reject(err);
      });
    });
  },


  /**
   * Authenticate through Master Secret.
   *
   * @returns {Promise}
   */
  master: function master() {
    var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

    if (!client.appKey || !client.masterSecret) {
      var error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    var promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.masterSecret
    });

    return promise;
  },


  /**
   * Do not authenticate.
   *
   * @returns {Promise}
   */
  none: function none() {
    return Promise.resolve(null);
  },


  /**
   * Authenticate through user credentials.
   *
   * @returns {Promise}
   */
  session: function session() {
    return _user2.default.getActive().then(function (user) {
      if (!user) {
        throw new Error('There is not an active user.');
      }

      return {
        scheme: 'Kinvey',
        credentials: user._kmd.authtoken
      };
    });
  }
};
exports.default = Auth;