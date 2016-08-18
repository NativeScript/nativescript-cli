'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.User = exports.UserStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _client = require('./client');

var _acl = require('./acl');

var _metadata = require('./metadata');

var _errors = require('./errors');

var _request = require('./requests/request');

var _datastore = require('./datastore');

var _network = require('./requests/network');

var _es6Promise = require('es6-promise');

var _social = require('./social');

var _storage = require('./utils/storage');

var _log = require('./log');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _es6Promise.Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _es6Promise.Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


var usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
var rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
var socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
var usernameAttribute = process.env.KINVEY_USERNAME_ATTRIBUTE || 'username';
var emailAttribute = process.env.KINVEY_EMAIL_ATTRIBUTE || 'email';

/**
 * The UserStore class is used to find, save, update, remove, count and group users.
 */

var UserStore = exports.UserStore = function (_NetworkStore) {
  _inherits(UserStore, _NetworkStore);

  function UserStore(options) {
    _classCallCheck(this, UserStore);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(UserStore).call(this, null, options));
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */


  _createClass(UserStore, [{
    key: 'create',


    /**
     * @private
     * @throws {KinveyError} Method is unsupported. Instead use User.signup() to create a user.
     */
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                throw new _errors.KinveyError('Please use `User.signup()` to create a user.');

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function create() {
        return _ref.apply(this, arguments);
      }

      return create;
    }()

    /**
     * Update a user.
     *
     * @deprecated Use the `update` function for a user instance.
     *
     * @param {Object} data Data for user to update.
     * @param {Object} [options={}] Options
     * @return {Promise<Object>} The updated user data.
     */

  }, {
    key: 'update',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2(data) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (data) {
                  _context2.next = 2;
                  break;
                }

                throw new _errors.KinveyError('No user was provided to be updated.');

              case 2:
                if (!(0, _isArray2.default)(data)) {
                  _context2.next = 4;
                  break;
                }

                throw new _errors.KinveyError('Only one user can be updated at one time.', data);

              case 4:
                if (data[idAttribute]) {
                  _context2.next = 6;
                  break;
                }

                throw new _errors.KinveyError('User must have an _id.');

              case 6:
                return _context2.abrupt('return', _get(Object.getPrototypeOf(UserStore.prototype), 'update', this).call(this, data, options));

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function update(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return update;
    }()

    /**
     * Check if a username already exists.
     *
     * @deprecated Use the `exists` function on the `User` class.
     *
     * @param {string} username Username
     * @param {Object} [options={}] Options
     * @return {boolean} True if the username already exists otherwise false.
     */

  }, {
    key: 'exists',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(username) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var config, request, response, data;
        return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/check-username-exists'
                  }),
                  properties: options.properties,
                  data: { username: username },
                  timeout: options.timeout,
                  client: this.client
                });
                request = new _network.NetworkRequest(config);
                _context3.next = 4;
                return request.execute();

              case 4:
                response = _context3.sent;
                data = response.data || {};
                return _context3.abrupt('return', data.usernameExists === true);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function exists(_x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return exists;
    }()

    /**
     * Restore a user that has been suspended.
     *
     * @deprecated Use the `restore` function on the `User` class.
     *
     * @param {string} id Id of the user to restore.
     * @param {Object} [options={}] Options
     * @return {Promise<Object>} The response.
     */

  }, {
    key: 'restore',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee4(id) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var config, request, response;
        return _regeneratorRuntime2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.Master,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + id
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                request = new _network.NetworkRequest(config);
                _context4.next = 4;
                return request.execute();

              case 4:
                response = _context4.sent;
                return _context4.abrupt('return', response.data);

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function restore(_x7, _x8) {
        return _ref4.apply(this, arguments);
      }

      return restore;
    }()
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appKey;
    }
  }]);

  return UserStore;
}(_datastore.NetworkStore);

/**
 * The User class is used to represent a single user on the Kinvey platform.
 * Use the user class to manage the active user lifecycle and perform user operations.
 */


var User = exports.User = function () {
  /**
   * Create a new instance of a User.
   *
   * @param {Object} [data={}] Data for the user.
   * @param {Object} [options={}] Options.
   * @return {User} User
   */
  function User() {
    var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, User);

    /**
     * The users data.
     *
     * @type {Object}
     */
    this.data = data;

    /**
     * @private
     * The client used by this user.
     *
     * @type {Client}
     */
    this.client = options.client || _client.Client.sharedInstance();
  }

  /**
   * The _id for the user.
   *
   * @return {?string} _id
   */


  _createClass(User, [{
    key: 'isActive',


    /**
     * Checks if the user is the active user.
     *
     * @return {boolean} True the user is the active user otherwise false.
     */
    value: function isActive() {
      var activeUser = User.getActiveUser(this.client);

      if (activeUser && activeUser[idAttribute] === this[idAttribute]) {
        return true;
      }

      return false;
    }

    /**
     * Checks if the users email is verfified.
     *
     * @return {boolean} True if the users email is verified otherwise false.
     */

  }, {
    key: 'isEmailVerified',
    value: function isEmailVerified() {
      var status = this.metadata.emailVerification;
      return status === 'confirmed';
    }

    /**
     * Gets the active user. You can optionally provide a client
     * to use to lookup the active user.
     *
     * @param {Client} [client=Client.sharedInstance()] Client to use to lookup active user.
     * @return {?User} The active user.
     */

  }, {
    key: 'login',


    /**
     * Login using a username or password.
     *
     * @param {string|Object} username Username or an object with username and password as properties.
     * @param {string} [password] Password
     * @param {Object} [options={}] Options
     * @return {Promise<User>} The user.
     */
    value: function () {
      var _ref5 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee5(username, password) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        var isActiveUser, activeUser, credentials, config, request, _ref6, data;

        return _regeneratorRuntime2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                isActiveUser = this.isActive();

                if (!isActiveUser) {
                  _context5.next = 3;
                  break;
                }

                return _context5.abrupt('return', _es6Promise.Promise.reject(new _errors.ActiveUserError('This user is already the active user.')));

              case 3:
                activeUser = User.getActiveUser(this.client);

                if (!activeUser) {
                  _context5.next = 6;
                  break;
                }

                return _context5.abrupt('return', _es6Promise.Promise.reject(new _errors.ActiveUserError('An active user already exists. ' + 'Please logout the active user before you login.')));

              case 6:
                credentials = username;

                if (!(0, _isObject2.default)(credentials)) {
                  credentials = {
                    username: username,
                    password: password
                  };
                }

                if (!credentials[socialIdentityAttribute]) {
                  if (credentials.username) {
                    credentials.username = String(credentials.username).trim();
                  }

                  if (credentials.password) {
                    credentials.password = String(credentials.password).trim();
                  }
                }

                if (!((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '') && !credentials[socialIdentityAttribute])) {
                  _context5.next = 11;
                  break;
                }

                return _context5.abrupt('return', _es6Promise.Promise.reject(new _errors.KinveyError('Username and/or password missing. ' + 'Please provide both a username and password to login.')));

              case 11:
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.apiProtocol,
                    host: this.client.apiHost,
                    pathname: this.pathname + '/login'
                  }),
                  body: credentials,
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                request = new _network.NetworkRequest(config);
                _context5.next = 15;
                return request.execute();

              case 15:
                _ref6 = _context5.sent;
                data = _ref6.data;

                this.data = data;
                (0, _storage.setActiveUser)(this.client, this.data);
                return _context5.abrupt('return', this);

              case 20:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function login(_x12, _x13, _x14) {
        return _ref5.apply(this, arguments);
      }

      return login;
    }()

    /**
     * Login using a username or password.
     *
     * @param {string|Object} username Username or an object with username and password as properties.
     * @param {string} [password] Password
     * @param {Object} [options={}] Options
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'loginWithMIC',


    /**
     * Login using Mobile Identity Connect.
     *
     * @param {string} redirectUri The redirect uri.
     * @param {AuthorizationGrant} [authorizationGrant=AuthoizationGrant.AuthorizationCodeLoginPage] MIC authorization grant to use.
     * @param {Object} [options] Options
     * @return {Promise<User>} The user.
     */
    value: function () {
      var _ref7 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee6(redirectUri, authorizationGrant) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var isActiveUser, activeUser, mic, session;
        return _regeneratorRuntime2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                isActiveUser = this.isActive();

                if (!isActiveUser) {
                  _context6.next = 3;
                  break;
                }

                return _context6.abrupt('return', _es6Promise.Promise.reject(new _errors.ActiveUserError('This user is already the active user.')));

              case 3:
                activeUser = User.getActiveUser(this.client);

                if (!activeUser) {
                  _context6.next = 6;
                  break;
                }

                return _context6.abrupt('return', _es6Promise.Promise.reject(new _errors.ActiveUserError('An active user already exists. ' + 'Please logout the active user before you login.')));

              case 6:
                mic = new _social.MobileIdentityConnect({ client: this.client });
                _context6.next = 9;
                return mic.login(redirectUri, authorizationGrant, options);

              case 9:
                session = _context6.sent;
                return _context6.abrupt('return', this.connectIdentity(_social.MobileIdentityConnect.identity, session, options));

              case 11:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function loginWithMIC(_x16, _x17, _x18) {
        return _ref7.apply(this, arguments);
      }

      return loginWithMIC;
    }()

    /**
     * Login using Mobile Identity Connect.
     *
     * @param {string} redirectUri The redirect uri.
     * @param {AuthorizationGrant} [authorizationGrant=AuthoizationGrant.AuthorizationCodeLoginPage] MIC authorization grant to use.
     * @param {Object} [options] Options
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'connectIdentity',


    /**
     * Connect an social identity.
     *
     * @param {string} identity Social identity.
     * @param {Object} session Social identity session.
     * @param {Object} [options] Options
     * @return {Promise<User>} The user.
     */
    value: function () {
      var _ref8 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee7(identity, session, options) {
        var data, socialIdentity, isActive;
        return _regeneratorRuntime2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                data = this.data;
                socialIdentity = data[socialIdentityAttribute] || {};

                socialIdentity[identity] = session;
                data[socialIdentityAttribute] = socialIdentity;
                this.data = data;

                _context7.prev = 5;
                isActive = this.isActive();

                if (!isActive) {
                  _context7.next = 9;
                  break;
                }

                return _context7.abrupt('return', this.update(data, options));

              case 9:
                _context7.next = 11;
                return this.login(data, null, options);

              case 11:
                (0, _storage.setIdentitySession)(this.client, identity, session);
                return _context7.abrupt('return', this);

              case 15:
                _context7.prev = 15;
                _context7.t0 = _context7['catch'](5);

                if (!(_context7.t0 instanceof _errors.NotFoundError)) {
                  _context7.next = 21;
                  break;
                }

                _context7.next = 20;
                return this.signup(data, options);

              case 20:
                return _context7.abrupt('return', this.connectIdentity(identity, session, options));

              case 21:
                throw _context7.t0;

              case 22:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this, [[5, 15]]);
      }));

      function connectIdentity(_x20, _x21, _x22) {
        return _ref8.apply(this, arguments);
      }

      return connectIdentity;
    }()

    /**
     * Connect an social identity.
     *
     * @deprecated Use connectIdentity().
     *
     * @param {string} identity Social identity.
     * @param {Object} session Social identity session.
     * @param {Object} [options] Options
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'connectWithIdentity',
    value: function () {
      var _ref9 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee8(identity, session, options) {
        return _regeneratorRuntime2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.abrupt('return', this.connectIdentity(identity, session, options));

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function connectWithIdentity(_x23, _x24, _x25) {
        return _ref9.apply(this, arguments);
      }

      return connectWithIdentity;
    }()

    /**
     * Connect a Facebook identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */

  }, {
    key: 'connectFacebook',
    value: function () {
      var _ref10 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee9(clientId, options) {
        var facebook, session;
        return _regeneratorRuntime2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                facebook = new _social.Facebook({ client: this.client });
                _context9.next = 3;
                return facebook.login(clientId, options);

              case 3:
                session = _context9.sent;
                return _context9.abrupt('return', this.connectIdentity(_social.Facebook.identity, session, options));

              case 5:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function connectFacebook(_x26, _x27) {
        return _ref10.apply(this, arguments);
      }

      return connectFacebook;
    }()

    /**
     * Connect a Facebook identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */

  }, {
    key: 'disconnectFacebook',


    /**
     * Diconnect a Facebook identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */
    value: function () {
      var _ref11 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee10(options) {
        return _regeneratorRuntime2.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                return _context10.abrupt('return', this.disconnectIdentity(_social.Facebook.identity, options));

              case 1:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function disconnectFacebook(_x28) {
        return _ref11.apply(this, arguments);
      }

      return disconnectFacebook;
    }()

    /**
     * Connect a Google identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */

  }, {
    key: 'connectGoogle',
    value: function () {
      var _ref12 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee11(clientId, options) {
        var google, session;
        return _regeneratorRuntime2.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                google = new _social.Google({ client: this.client });
                _context11.next = 3;
                return google.login(clientId, options);

              case 3:
                session = _context11.sent;
                return _context11.abrupt('return', this.connectIdentity(_social.Google.identity, session, options));

              case 5:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function connectGoogle(_x29, _x30) {
        return _ref12.apply(this, arguments);
      }

      return connectGoogle;
    }()

    /**
     * Connect a Google identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */

  }, {
    key: 'disconnectGoogle',


    /**
     * Diconnect a Google identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */
    value: function () {
      var _ref13 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee12(options) {
        return _regeneratorRuntime2.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                return _context12.abrupt('return', this.disconnectIdentity(_social.Google.identity, options));

              case 1:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function disconnectGoogle(_x31) {
        return _ref13.apply(this, arguments);
      }

      return disconnectGoogle;
    }()

    /**
     * Connect a LinkedIn identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */

  }, {
    key: 'connectLinkedIn',
    value: function () {
      var _ref14 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee13(clientId, options) {
        var linkedIn, session;
        return _regeneratorRuntime2.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                linkedIn = new _social.LinkedIn({ client: this.client });
                _context13.next = 3;
                return linkedIn.login(clientId, options);

              case 3:
                session = _context13.sent;
                return _context13.abrupt('return', this.connectIdentity(_social.LinkedIn.identity, session, options));

              case 5:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function connectLinkedIn(_x32, _x33) {
        return _ref14.apply(this, arguments);
      }

      return connectLinkedIn;
    }()

    /**
     * Connect a LinkedIn identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */

  }, {
    key: 'disconnectLinkedIn',


    /**
     * Diconnect a LinkedIn identity.
     *
     * @param  {Object}         [options]     Options
     * @return {Promise<User>}                The user.
     */
    value: function () {
      var _ref15 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee14(options) {
        return _regeneratorRuntime2.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                return _context14.abrupt('return', this.disconnectIdentity(_social.LinkedIn.identity, options));

              case 1:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function disconnectLinkedIn(_x34) {
        return _ref15.apply(this, arguments);
      }

      return disconnectLinkedIn;
    }()

    /**
     * @private
     * Disconnects the user from an identity.
     *
     * @param {SocialIdentity|string} identity Identity used to connect the user.
     * @param  {Object} [options] Options
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'disconnectIdentity',
    value: function () {
      var _ref16 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee15(identity, options) {
        var data, socialIdentity;
        return _regeneratorRuntime2.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.prev = 0;

                if (!(identity === _social.Facebook.identity)) {
                  _context15.next = 6;
                  break;
                }

                _context15.next = 4;
                return _social.Facebook.logout(options);

              case 4:
                _context15.next = 19;
                break;

              case 6:
                if (!(identity === _social.Google.identity)) {
                  _context15.next = 11;
                  break;
                }

                _context15.next = 9;
                return _social.Google.logout(options);

              case 9:
                _context15.next = 19;
                break;

              case 11:
                if (!(identity === _social.LinkedIn.identity)) {
                  _context15.next = 16;
                  break;
                }

                _context15.next = 14;
                return _social.LinkedIn.logout(options);

              case 14:
                _context15.next = 19;
                break;

              case 16:
                if (!(identity === _social.MobileIdentityConnect.identity)) {
                  _context15.next = 19;
                  break;
                }

                _context15.next = 19;
                return _social.MobileIdentityConnect.logout(this, options);

              case 19:

                (0, _storage.setIdentitySession)(this.client, identity, null);
                _context15.next = 25;
                break;

              case 22:
                _context15.prev = 22;
                _context15.t0 = _context15['catch'](0);

                _log.Log.error(_context15.t0);

              case 25:
                data = this.data;
                socialIdentity = data[socialIdentityAttribute] || {};

                delete socialIdentity[identity];
                data[socialIdentityAttribute] = socialIdentity;
                this.data = data;

                if (this[idAttribute]) {
                  _context15.next = 32;
                  break;
                }

                return _context15.abrupt('return', this);

              case 32:
                _context15.next = 34;
                return this.update(data, options);

              case 34:
                return _context15.abrupt('return', this);

              case 35:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this, [[0, 22]]);
      }));

      function disconnectIdentity(_x35, _x36) {
        return _ref16.apply(this, arguments);
      }

      return disconnectIdentity;
    }()

    /**
     * Logout the active user.
     *
     * @param {Object} [options={}] Options
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'logout',
    value: function () {
      var _ref17 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee16() {
        var _this2 = this;

        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var config, request, identities, promises;
        return _regeneratorRuntime2.default.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                _context16.prev = 0;
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.Session,
                  url: _url2.default.format({
                    protocol: this.client.apiProtocol,
                    host: this.client.apiHost,
                    pathname: this.pathname + '/_logout'
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                request = new _network.NetworkRequest(config);
                _context16.next = 5;
                return request.execute();

              case 5:
                _context16.next = 10;
                break;

              case 7:
                _context16.prev = 7;
                _context16.t0 = _context16['catch'](0);

                _log.Log.error(_context16.t0);

              case 10:
                _context16.prev = 10;
                identities = Object.keys(this._socialIdentity);
                promises = identities.map(function (identity) {
                  return _this2.disconnectIdentity(identity, options);
                });
                _context16.next = 15;
                return _es6Promise.Promise.all(promises);

              case 15:
                _context16.next = 20;
                break;

              case 17:
                _context16.prev = 17;
                _context16.t1 = _context16['catch'](10);

                _log.Log.error(_context16.t1);

              case 20:

                (0, _storage.setActiveUser)(this.client, null);
                _context16.next = 23;
                return _datastore.DataStore.clearCache({ client: this.client });

              case 23:
                return _context16.abrupt('return', this);

              case 24:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, this, [[0, 7], [10, 17]]);
      }));

      function logout(_x37) {
        return _ref17.apply(this, arguments);
      }

      return logout;
    }()

    /**
     * Sign up a user with Kinvey.
     *
     * @param {?User|?Object} user Users data.
     * @param {Object} [options] Options
     * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
     *                                       being signed up.
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'signup',
    value: function () {
      var _ref18 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee17(user) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var activeUser, config, request, response;
        return _regeneratorRuntime2.default.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                options = (0, _assign2.default)({
                  state: true
                }, options);

                if (!(options.state === true)) {
                  _context17.next = 5;
                  break;
                }

                activeUser = User.getActiveUser(this.client);

                if (!activeUser) {
                  _context17.next = 5;
                  break;
                }

                throw new _errors.ActiveUserError('An active user already exists.' + ' Please logout the active user before you login.');

              case 5:

                if (user instanceof User) {
                  user = user.data;
                }

                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  body: (0, _isEmpty2.default)(user) ? null : user,
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                request = new _network.NetworkRequest(config);
                _context17.next = 10;
                return request.execute();

              case 10:
                response = _context17.sent;

                this.data = response.data;

                if (options.state === true) {
                  (0, _storage.setActiveUser)(this.client, this.data);
                }

                return _context17.abrupt('return', this);

              case 14:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function signup(_x39, _x40) {
        return _ref18.apply(this, arguments);
      }

      return signup;
    }()

    /**
     * Sign up a user with Kinvey.
     *
     * @param {User|Object} data Users data.
     * @param {Object} [options] Options
     * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
     *                                       being signed up.
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'signupWithIdentity',


    /**
     * Sign up a user with Kinvey using an identity.
     *
     * @param {SocialIdentity|string} identity The identity.
     * @param {Object} session Identity session
     * @param {Object} [options] Options
     * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
     *                                       being signed up.
     * @return {Promise<User>} The user.
     */
    value: function signupWithIdentity(identity, session, options) {
      var data = {};
      data[socialIdentityAttribute] = {};
      data[socialIdentityAttribute][identity] = session;
      return this.signup(data, options);
    }

    /**
     * Sign up a user with Kinvey using an identity.
     *
     * @param {SocialIdentity|string} identity The identity.
     * @param {Object} session Identity session
     * @param {Object} [options] Options
     * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
     *                                       being signed up.
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'update',


    /**
     * Update the users data.
     *
     * @param {Object} data Data.
     * @param {Object} [options] Options
     * @return {Promise<User>} The user.
     */
    value: function () {
      var _ref19 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee18(data, options) {
        var userStore;
        return _regeneratorRuntime2.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                data = (0, _assign2.default)(this.data, data);
                userStore = new UserStore();
                _context18.next = 4;
                return userStore.update(data, options);

              case 4:

                if (this.isActive()) {
                  (0, _storage.setActiveUser)(this.client, this.data);
                }

                return _context18.abrupt('return', this);

              case 6:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function update(_x42, _x43) {
        return _ref19.apply(this, arguments);
      }

      return update;
    }()

    /**
     * Retfresh the users data.
     *
     * @param {Object} [options={}] Options
     * @return {Promise<User>} The user.
     */

  }, {
    key: 'me',
    value: function () {
      var _ref20 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee19() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var config, request, _ref21, data, activeUser;

        return _regeneratorRuntime2.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.GET,
                  authType: _request.AuthType.Session,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/_me'
                  }),
                  properties: options.properties,
                  timeout: options.timeout
                });
                request = new _network.NetworkRequest(config);
                _context19.next = 4;
                return request.execute();

              case 4:
                _ref21 = _context19.sent;
                data = _ref21.data;

                this.data = data;

                if (!this.authtoken) {
                  activeUser = User.getActiveUser(this.client);


                  if (activeUser) {
                    this.authtoken = activeUser.authtoken;
                  }
                }

                (0, _storage.setActiveUser)(this.client, this.data);
                return _context19.abrupt('return', this);

              case 10:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function me(_x44) {
        return _ref20.apply(this, arguments);
      }

      return me;
    }()

    /**
     * Request an email to be sent to verify the users email.
     *
     * @param {Object} [options={}] Options
     * @return {Promise<Object>} The response.
     */

  }, {
    key: 'verifyEmail',
    value: function () {
      var _ref22 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee20() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var config, request, _ref23, data;

        return _regeneratorRuntime2.default.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/' + this.username + '/user-email-verification-initiate'
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                request = new _network.NetworkRequest(config);
                _context20.next = 4;
                return request.execute();

              case 4:
                _ref23 = _context20.sent;
                data = _ref23.data;
                return _context20.abrupt('return', data);

              case 7:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function verifyEmail(_x46) {
        return _ref22.apply(this, arguments);
      }

      return verifyEmail;
    }()

    /**
     * Request an email to be sent to recover a forgot username.
     *
     * @param {Object} [options={}] Options
     * @return {Promise<Object>} The response.
     */

  }, {
    key: 'forgotUsername',
    value: function () {
      var _ref24 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee21() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var config, request, _ref25, data;

        return _regeneratorRuntime2.default.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/user-forgot-username'
                  }),
                  properties: options.properties,
                  data: { email: this.email },
                  timeout: options.timeout,
                  client: this.client
                });
                request = new _network.NetworkRequest(config);
                _context21.next = 4;
                return request.execute();

              case 4:
                _ref25 = _context21.sent;
                data = _ref25.data;
                return _context21.abrupt('return', data);

              case 7:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function forgotUsername(_x48) {
        return _ref24.apply(this, arguments);
      }

      return forgotUsername;
    }()

    /**
     * Request an email to be sent to reset the users password.
     *
     * @param {Object} [options = {}] Options
     * @return {Promise<Object>} The response.
     */

  }, {
    key: 'resetPassword',
    value: function resetPassword() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options.client = this.client;
      return User.resetPassword(this.username, options);
    }

    /**
     * Request an email to be sent to reset a users password.
     *
     * @param {string} username Username
     * @param {Object} [options={}] Options
     * @return {Promise<Object>} The response.
     */

  }, {
    key: '_id',
    get: function get() {
      return this.data[idAttribute];
    }

    /**
     * The _acl for the user.
     *
     * @return {Acl} _acl
     */

  }, {
    key: '_acl',
    get: function get() {
      return new _acl.Acl(this.data);
    }

    /**
     * The metadata for the user.
     *
     * @return {Metadata} metadata
     */

  }, {
    key: 'metadata',
    get: function get() {
      return new _metadata.Metadata(this.data);
    }

    /**
     * Set the metadata for the user.
     *
     * @param {Metadata|Object} metadata The metadata.
     */
    ,
    set: function set(metadata) {
      this.data[kmdAttribute] = (0, _result2.default)(metadata, 'toJSON', metadata);
    }

    /**
     * The _kmd for the user.
     *
     * @return {Metadata} _kmd
     */

  }, {
    key: '_kmd',
    get: function get() {
      return this.metadata;
    }

    /**
     * Set the _kmd for the user.
     *
     * @param {Metadata|Object} metadata The metadata.
     */
    ,
    set: function set(kmd) {
      this.metadata = kmd;
    }

    /**
     * The _socialIdentity for the user.
     *
     * @return {Object} _socialIdentity
     */

  }, {
    key: '_socialIdentity',
    get: function get() {
      return this.data[socialIdentityAttribute];
    }

    /**
     * The auth token for the user.
     *
     * @return {?string} Auth token
     */

  }, {
    key: 'authtoken',
    get: function get() {
      return this.metadata.authtoken;
    }

    /**
     * Set the auth token for the user.
     *
     * @param  {?string} authtoken Auth token
     */
    ,
    set: function set(authtoken) {
      var metadata = this.metadata;
      metadata.authtoken = authtoken;
      this.metadata = metadata;
    }

    /**
     * The username for the user.
     *
     * @return {?string} Username
     */

  }, {
    key: 'username',
    get: function get() {
      return this.data[usernameAttribute];
    }

    /**
     * The email for the user.
     *
     * @return {?string} Email
     */

  }, {
    key: 'email',
    get: function get() {
      return this.data[emailAttribute];
    }

    /**
     * @private
     */

  }, {
    key: 'pathname',
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appKey;
    }
  }], [{
    key: 'getActiveUser',
    value: function getActiveUser() {
      var client = arguments.length <= 0 || arguments[0] === undefined ? _client.Client.sharedInstance() : arguments[0];

      var data = client.activeUser;
      var user = null;

      if (data) {
        user = new User(data);
        user.client = client;
      }

      return user;
    }
  }, {
    key: 'login',
    value: function login(username, password, options) {
      var user = new User({}, options);
      return user.login(username, password, options);
    }
  }, {
    key: 'loginWithMIC',
    value: function loginWithMIC(redirectUri, authorizationGrant) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var user = new User({}, options);
      user.client = options.client || _client.Client.sharedInstance();
      return user.loginWithMIC(redirectUri, authorizationGrant, options);
    }
  }, {
    key: 'connectFacebook',
    value: function connectFacebook(clientId, options) {
      var user = new User({}, options);
      return user.connectFacebook(clientId, options);
    }
  }, {
    key: 'connectGoogle',
    value: function connectGoogle(clientId, options) {
      var user = new User({}, options);
      return user.connectGoogle(clientId, options);
    }
  }, {
    key: 'connectLinkedIn',
    value: function connectLinkedIn(clientId, options) {
      var user = new User({}, options);
      return user.connectLinkedIn(clientId, options);
    }
  }, {
    key: 'signup',
    value: function signup(data, options) {
      var user = new User({}, options);
      return user.signup(data, options);
    }
  }, {
    key: 'signupWithIdentity',
    value: function signupWithIdentity(identity, session, options) {
      var user = new User({}, options);
      return user.signupWithIdentity(identity, session, options);
    }
  }, {
    key: 'resetPassword',
    value: function () {
      var _ref26 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee22(username) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var client, config, request, _ref27, data;

        return _regeneratorRuntime2.default.wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                if (username) {
                  _context22.next = 2;
                  break;
                }

                throw new _errors.KinveyError('A username was not provided.', 'Please provide a username for the user that you would like to reset their password.');

              case 2:
                if ((0, _isString2.default)(username)) {
                  _context22.next = 4;
                  break;
                }

                throw new _errors.KinveyError('The provided username is not a string.');

              case 4:
                client = options.client || _client.Client.sharedInstance();
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: client.protocol,
                    host: client.host,
                    pathname: '/' + rpcNamespace + '/' + client.appKey + '/' + username + '/user-password-reset-initiate'
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: client
                });
                request = new _network.NetworkRequest(config);
                _context22.next = 9;
                return request.execute();

              case 9:
                _ref27 = _context22.sent;
                data = _ref27.data;
                return _context22.abrupt('return', data);

              case 12:
              case 'end':
                return _context22.stop();
            }
          }
        }, _callee22, this);
      }));

      function resetPassword(_x53, _x54) {
        return _ref26.apply(this, arguments);
      }

      return resetPassword;
    }()

    /**
     * Check if a username already exists.
     *
     * @param {string} username Username
     * @param {Object} [options] Options
     * @return {boolean} True if the username already exists otherwise false.
     */

  }, {
    key: 'exists',
    value: function exists(username, options) {
      var store = new UserStore(options);
      return store.exists(username, options);
    }

    /**
     * Restore a user that has been suspended.
     *
     * @param {string} id Id of the user to restore.
     * @param {Object} [options] Options
     * @return {Promise<Object>} The response.
     */

  }, {
    key: 'restore',
    value: function restore(id, options) {
      var store = new UserStore(options);
      return store.restore(id, options);
    }
  }]);

  return User;
}();