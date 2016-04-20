'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.User = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _client = require('./client');

var _query = require('./query');

var _acl = require('./acl');

var _metadata = require('./metadata');

var _errors = require('./errors');

var _mic = require('./mic');

var _enums = require('./enums');

var _datastore = require('./stores/datastore');

var _network = require('./requests/network');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
var usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
var rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
var socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
var usernameAttribute = process.env.KINVEY_USERNAME_ATTRIBUTE || 'username';
var emailAttribute = process.env.KINVEY_EMAIL_ATTRIBUTE || 'email';
var supportedIdentities = ['facebook', 'google', 'linkedIn'];
var hello = void 0;

if (typeof window !== 'undefined') {
  hello = require('hellojs');
}

/**
 * The User class is used to represent a single user on the Kinvey platform.
 * Use the user class to manage the active user lifecycle and perform user operations.
 */

var User = exports.User = function () {
  /**
   * Create a new instance of a User.
   *
   * @param  {Object}   [data={}]    Data for the user.
   * @return {User}                  User
   *
   * @example
   * var user = new User();
   */

  function User() {
    var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
    this.client = _client.Client.sharedInstance();
  }

  /**
   * The _id for the user.
   *
   * @return {?string} _id
   *
   * @example
   * var _id = user._id;
   */


  _createClass(User, [{
    key: 'setAsActiveUser',


    /**
     * Set this user as the active user.
     *
     * @return {Promise<User>}  The active user.
     *
     * @example
     * var promise = user.setAsActiveUser();
     * promise.then(function(activeUser) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */
    value: function setAsActiveUser() {
      return User.setActiveUser(this, this.client);
    }

    /**
     * Checks if this user is the active user.
     *
     * @return {Promise<Boolean>} True or false if this user is the active user.
     *
     * @example
     * var promise = user.isActiveUser();
     * promise.then(function(isActiveUser) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'isActive',
    value: function isActive() {
      var activeUser = User.getActiveUser(this.client);

      if (activeUser && activeUser._id === this._id) {
        return true;
      }

      return false;
    }
  }, {
    key: 'login',


    /**
     * Login using a username or password.
     *
     * @param  {string|Object}      usernameOrData    Username or an object with username
     *                                                and password properties.
     * @param  {string}             [password]        Users password.
     * @param  {Object}             [options={}]      Options
     * @return {Promise<User>}                        The logged in user.
     *
     * @example
     * var promise = user.login('username', 'password');
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */
    value: function login(usernameOrData, password) {
      var _this = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!(0, _isObject2.default)(usernameOrData)) {
        usernameOrData = {
          username: usernameOrData,
          password: password
        };
      }

      if (!usernameOrData._socialIdentity) {
        if (usernameOrData.username) {
          usernameOrData.username = String(usernameOrData.username).trim();
        }

        if (usernameOrData.password) {
          usernameOrData.password = String(usernameOrData.password).trim();
        }
      }

      var isActiveUser = this.isActive();
      if (isActiveUser) {
        return _babybird2.default.reject(new _errors.ActiveUserError('This user is already the active user.'));
      }

      var activeUser = User.getActiveUser(this.client);
      if (activeUser) {
        return _babybird2.default.reject(new _errors.ActiveUserError('An active user already exists. ' + 'Please logout the active user before you login.'));
      }

      if ((!usernameOrData.username || usernameOrData.username === '' || !usernameOrData.password || usernameOrData.password === '') && !usernameOrData[socialIdentityAttribute]) {
        return _babybird2.default.reject(new _errors.KinveyError('Username and/or password missing. ' + 'Please provide both a username and password to login.'));
      }

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.App,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname + '/login'
        }),
        data: usernameOrData,
        properties: options.properties,
        timeout: options.timeout
      });

      var promise = request.execute().then(function (response) {
        _this.data = response.data;
        return _this.setAsActiveUser();
      });

      return promise;
    }
  }, {
    key: 'loginWithIdentity',
    value: function loginWithIdentity(identity, token, options) {
      var data = { _socialIdentity: {} };
      data._socialIdentity[identity] = token;
      return this.login(data, options);
    }
  }, {
    key: 'loginWithMIC',


    /* eslint-disable max-len */
    /**
     * Login using Mobile Identity Connect.
     *
     * @param  {string}                 redirectUri                                                         The redirect uri used
     *                                                                                                      for MIC logins.
     * @param  {AuthorizationGrant}     [authorizationGrant=AuthoizationGrant.AuthorizationCodeLoginPage]   MIC authorization grant to use.
     * @param  {Object}                 [options={}]                                                        Options
     * @return {Promise<User>}                                                                              The logged in user.
     *
     * @example
     * var promise = user.loginWithMIC('http://example.com');
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */
    /* eslint-enable max-len */
    value: function loginWithMIC(redirectUri, authorizationGrant) {
      var _this2 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var mic = new _mic.MobileIdentityConnect(this.client);
      return mic.login(redirectUri, authorizationGrant, options).then(function (token) {
        options.redirectUri = redirectUri;
        options.micClient = (0, _result2.default)(mic.client, 'toJSON', mic.client);
        return _this2.connect(_mic.MobileIdentityConnect.identity, token, options);
      });
    }

    /**
     * Logout the user. If the user was the active user then the active user will be set to null.
     *
     * @param  {Object}         [options={}]    Options
     * @return {Promise<User>}                  The logged out user.
     *
     * @example
     * var promise = user.logout();
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'logout',
    value: function logout() {
      var _this3 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var isActive = this.isActive();

      if (!isActive) {
        return _babybird2.default.resolve();
      }

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.Session,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: '/' + usersNamespace + '/' + this.client.appKey + '/_logout'
        }),
        properties: options.properties,
        timeout: options.timeout
      });

      var promise = request.execute().catch(function () {
        return null;
      }).then(function () {
        var isActive = _this3.isActive();
        if (isActive) {
          return User.setActiveUser(null, _this3.client);
        }

        return null;
      }).then(function () {
        return _this3;
      });

      return promise;
    }

    /**
     * @private
     * Returns true or false if identity connect is supported.
     *
     * @return {Boolean}  True or false if identity connect is supported.
     *
     * @example
     * var isIdentitySupported = user.isIdentitySupported('identity');
     */

  }, {
    key: 'connectWithIdentity',


    /* eslint-disable max-len */
    /**
     * Connect using an identity (Facebook, Google, LinkedIn etc.).
     *
     * @param  {SocialIdentity|string}         identity                                Identity used to connect the user.
     * @param  {Object}                        [options={}]                            Options
     * @param  {string}                        [options.collectionName='Identities']   Collection name to use to lookup credentials
     *                                                                                 for the identity.
     * @return {Promise<User>}                                                         The connected user.
     *
     * @example
     * var promise = user.connectWithIdentity(SocialIdentity.Facebook);
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */
    /* eslint-enable max-len */
    value: function connectWithIdentity(identity) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _assign2.default)({
        collectionName: 'identities'
      }, options);

      var promise = _babybird2.default.resolve().then(function () {
        if (!identity) {
          throw new _errors.KinveyError('An identity is required to connect the user.');
        }

        if (!User.isIdentitySupported(identity)) {
          throw new _errors.KinveyError('Identity ' + identity + ' is not supported on this platform.');
        }

        var query = new _query.Query().equalTo('identity', identity);
        var request = new _network.NetworkRequest({
          method: _enums.HttpMethod.GET,
          authType: _enums.AuthType.None,
          url: _url2.default.format({
            protocol: _this4.client.protocol,
            host: _this4.client.host,
            pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + options.collectionName
          }),
          query: query,
          properties: options.properties,
          timeout: options.timeout
        });
        return request.execute();
      }).then(function (response) {
        if (response.data.length === 1) {
          var helloSettings = {};
          helloSettings[identity] = response.data[0].key || response.data[0].appId || response.data[0].clientId;
          hello.init(helloSettings);
          return hello(identity).login();
        }

        throw new _errors.KinveyError('Unsupported identity.');
      }).then(function () {
        var authResponse = hello(identity).getAuthResponse();
        return _this4.connect(identity, authResponse, options);
      });

      return promise;
    }

    /**
     * @private
     *
     * Connects with the provided accessToken and identity.
     *
     * @param  {SocialIdentity|string}         identity      Identity used to connect the user.
     * @param  {string}                        accessToken   Access token for the identity.
     * @param  {number}                        [expiresIn]   Time in seconds for how long the access token is valid.
     * @param  {Object}                        [options={}]  Options
     * @return {Promise<User>}                               The connected user.
     *
     * @example
     * var token = {
     *   access_token: 'access_token',
     *   refresh_token: 'refresh_token',
     *   expires_in: 3600
     * };
     * var promise = user.connect(SocialIdentity.Facebook, token);
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'connect',
    value: function connect(identity, token) {
      var _this5 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var data = this.data;
      var socialIdentity = data[socialIdentityAttribute] || {};
      socialIdentity[identity] = token;
      data[socialIdentityAttribute] = socialIdentity;
      this.data = data;

      var promise = _babybird2.default.resolve().then(function () {
        var isActive = _this5.isActive();

        if (isActive) {
          options._identity = identity;
          return _this5.update(data, options);
        }

        return _this5.login(data, null, options);
      }).catch(function (err) {
        if (err instanceof _errors.NotFoundError) {
          return _this5.signup(data, options).then(function () {
            return _this5.connect(identity, token, options);
          });
        }

        throw err;
      }).then(function () {
        _this5.client.socialIdentity = {
          identity: identity,
          token: _this5._socialIdentity[identity],
          redirectUri: options.redirectUri,
          client: options.micClient
        };
        return _this5;
      });

      return promise;
    }
  }, {
    key: 'disconnect',
    value: function disconnect(identity) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var data = this.data;
      var socialIdentity = data[socialIdentityAttribute] || {};
      delete socialIdentity[identity];
      data[socialIdentityAttribute] = socialIdentity;
      this.data = data;

      var promise = _babybird2.default.resolve().then(function () {
        if (!_this6._id) {
          return _this6;
        }

        return _this6.update(data, options);
      }).then(function () {
        var socialIdentity = _this6.client.socialIdentity;

        if (socialIdentity.identity === identity) {
          _this6.client.socialIdentity = null;
        }

        return _this6;
      });

      return promise;
    }
  }, {
    key: 'signup',


    /**
     * Sign up. If options.state is set to true then the user
     * will be set as the active user after succesfully signing up the
     * user.
     *
     * @param  {User|Object}    data                    Users data.
     * @param  {Object}         [options={}]            Options
     * @param  {Boolean}        [options.state=true]    If set to true, the user will be
     *                                                  set as the active user after successfully
     *                                                  being signed up.
     * @return {Promise<User>}                          The signed up user.
     *
     * @example
     * var promise = user.signup({
     *   username: 'admin',
     *   password: 'admin'
     * });
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */
    value: function signup(data) {
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _assign2.default)({
        state: true
      }, options);

      var promise = _babybird2.default.resolve().then(function () {
        if (options.state === true) {
          var activeUser = User.getActiveUser(_this7.client);
          if (activeUser) {
            throw new _errors.ActiveUserError('An active user already exists. ' + 'Please logout the active user before you login.');
          }
        }
      }).then(function () {
        var request = new _network.NetworkRequest({
          method: _enums.HttpMethod.POST,
          authType: _enums.AuthType.App,
          url: _url2.default.format({
            protocol: _this7.client.protocol,
            host: _this7.client.host,
            pathname: '/' + usersNamespace + '/' + _this7.client.appKey
          }),
          data: (0, _result2.default)(data, 'toJSON', data),
          properties: options.properties,
          timeout: options.timeout
        });
        return request.execute();
      }).then(function (response) {
        _this7.data = response.data;

        if (options.state === true) {
          return _this7.setAsActiveUser();
        }

        return _this7;
      });

      return promise;
    }
  }, {
    key: 'signupWithIdentity',
    value: function signupWithIdentity(identity, tokens, options) {
      var data = { _socialIdentity: {} };
      data._socialIdentity[identity] = tokens;
      return this.signup(data, options);
    }
  }, {
    key: 'update',
    value: function update(data, options) {
      var _this8 = this;

      var userStore = _datastore.DataStore.getInstance(null, _datastore.DataStoreType.User);
      return userStore.save(data, options).then(function (data) {
        _this8.data = data;

        if (_this8.isActive()) {
          return _this8.setAsActiveUser();
        }

        return _this8;
      });
    }
  }, {
    key: 'me',
    value: function me() {
      var _this9 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.GET,
        authType: _enums.AuthType.Session,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: '/' + usersNamespace + '/' + this.client.appKey + '/_me'
        }),
        properties: options.properties,
        timeout: options.timeout
      });

      var promise = request.execute().then(function (response) {
        _this9.data = response.data;

        if (!_this9.authtoken) {
          var activeUser = User.getActiveUser(_this9.client);

          if (activeUser) {
            _this9.authtoken = activeUser.authtoken;
          }
        }

        return _this9.setAsActiveUser();
      });

      return promise;
    }
  }, {
    key: 'verifyEmail',
    value: function verifyEmail() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.App,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/' + this.username + '/user-email-verification-initiate'
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });

      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
    }
  }, {
    key: 'forgotUsername',
    value: function forgotUsername() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.App,
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

      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
    }
  }, {
    key: 'resetPassword',
    value: function resetPassword() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.App,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/' + this.username + '/user-password-reset-initiate'
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });

      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
    }

    // refreshAuthToken(options = {}) {
    //   const socialIdentity = this.data[socialIdentityAttribute];
    //   const identity = socialIdentity.activeIdentity;
    //   const token = socialIdentity[identity];
    //   let promise;

    //   switch (identity) {
    //     case MobileIdentityConnect.identity:
    //       const mic = new MobileIdentityConnect(this.client);
    //       promise = mic.refresh(token, options);
    //       break;
    //     default:
    //       promise = Promise.reject(new KinveyError(`Unable to refresh the auth token because ` +
    //         `the ${identity} identity is not supported.`));
    //   }

    //   return promise.then(token => {
    //     return this.connect(identity, token, options);
    //   });
    // }

  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this.data;
    }
  }, {
    key: '_id',
    get: function get() {
      return this.data[idAttribute];
    }

    /**
     * The _acl for the user.
     *
     * @return {Acl} _acl
     *
     * @example
     * var _acl = user._acl;
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
     *
     * @example
     * var metadata = user.metadata;
     */

  }, {
    key: 'metadata',
    get: function get() {
      return new _metadata.Metadata(this.data);
    },
    set: function set(metadata) {
      this.data[kmdAttribute] = (0, _result2.default)(metadata, 'toJSON', metadata);
    }

    /**
     * The _kmd for the user.
     *
     * @return {Metadata} _kmd
     *
     * @example
     * var _kmd = user._kmd;
     */

  }, {
    key: '_kmd',
    get: function get() {
      return this.metadata;
    },
    set: function set(kmd) {
      this.metadata = kmd;
    }
  }, {
    key: '_socialIdentity',
    get: function get() {
      return this.data[socialIdentityAttribute];
    }

    /**
     * The auth token for the user.
     *
     * @return {?string} Auth token
     *
     * @example
     * var authtoken = user.authtoken;
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
     *
     * @example
     * user.authtoken = 'authtoken';
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
     *
     * @example
     * var username = user.username;
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
     *
     * @example
     * var email = user.email;
     */

  }, {
    key: 'email',
    get: function get() {
      return this.data[emailAttribute];
    }
  }, {
    key: '_pathname',
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appKey;
    }

    /**
     * Gets the active user. You can optionally provide a client
     * to use to lookup the active user.
     *
     * @param  {Client}           [client=Client.sharedInstance()]   Client to use to set the active user.
     * @return {Promise<User>}                                       The active user on the client. The
     *                                                               active user could be null if one does
     *                                                               not exist.
     *
     * @example
     * var _id = user._id;
     */

  }], [{
    key: 'getActiveUser',
    value: function getActiveUser() {
      var client = arguments.length <= 0 || arguments[0] === undefined ? _client.Client.sharedInstance() : arguments[0];

      var data = client.user;
      var user = null;

      if (data) {
        user = new User(data);
        user.client = client;
      }

      return user;
    }

    /**
     * Sets the active user. You can optionally provide a client to
     * set the active user on. Only one active user per client is
     * allowed.
     *
     * @param  {?(User|Object)}      [user]                               User to set as the active user.
     * @param  {Client}              [client=Client.sharedInstance()]     The client to use to set the active user on.
     * @return {Promise<User>}                                            The active user on the client. The active user
     *                                                                    could be null if one does not exist.
     *
     * @example
     * var user = new User();
     * var promise = User.setActiveUser(user);
     * promise.then(function(activeUser) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'setActiveUser',
    value: function setActiveUser(user) {
      var client = arguments.length <= 1 || arguments[1] === undefined ? _client.Client.sharedInstance() : arguments[1];

      var data = (0, _result2.default)(user, 'toJSON', user);
      client.user = data;
      return User.getActiveUser(client);
    }
  }, {
    key: 'login',
    value: function login(usernameOrData, password, options) {
      var user = new User();
      return user.login(usernameOrData, password, options);
    }
  }, {
    key: 'loginWithIdentity',
    value: function loginWithIdentity(identity, tokens, options) {
      var user = new User();
      return user.loginWithIdentity(identity, tokens, options);
    }
  }, {
    key: 'loginWithMIC',
    value: function loginWithMIC(redirectUri, authorizationGrant, options) {
      var user = new User();
      return user.loginWithMIC(redirectUri, authorizationGrant, options);
    }
  }, {
    key: 'isIdentitySupported',
    value: function isIdentitySupported(identity) {
      return hello && supportedIdentities.indexOf(identity) !== -1;
    }

    /**
     * Connect using Facebook.
     *
     * @param  {Object}         [options={}]  Options
     * @return {Promise<User>}                The connected user.
     *
     * @example
     * var promise = user.connectWithFacebook();
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'connectWithFacebook',
    value: function connectWithFacebook() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return User.connectWithIdentity(_enums.SocialIdentity.Facebook, options);
    }

    /**
     * Connect using Google.
     *
     * @param  {Object}         [options={}]  Options
     * @return {Promise<User>}                The connected user.
     *
     * @example
     * var promise = user.connectWithGoogle();
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'connectWithGoogle',
    value: function connectWithGoogle() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return User.connectWithIdentity(_enums.SocialIdentity.Google, options);
    }

    /**
     * Connect using LinkedIn.
     *
     * @param  {Object}         [options={}]  Options
     * @return {Promise<User>}                The connected user.
     *
     * @example
     * var promise = user.connectWithLinkedIn();
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'connectWithLinkedIn',
    value: function connectWithLinkedIn() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return User.connectWithIdentity(_enums.SocialIdentity.LinkedIn, options);
    }
  }, {
    key: 'connectWithIdentity',
    value: function connectWithIdentity(identity, options) {
      var user = new User();
      return user.connectWithIdentity(identity, options);
    }
  }, {
    key: 'signup',
    value: function signup(data, options) {
      var user = new User();
      return user.signup(data, options);
    }
  }, {
    key: 'signupWithIdentity',
    value: function signupWithIdentity(identity, tokens, options) {
      var user = new User();
      return user.signupWithIdentity(identity, tokens, options);
    }
  }]);

  return User;
}();