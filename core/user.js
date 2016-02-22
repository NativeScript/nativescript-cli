'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.User = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _acl = require('./acl');

var _acl2 = _interopRequireDefault(_acl);

var _metadata = require('./metadata');

var _metadata2 = _interopRequireDefault(_metadata);

var _errors = require('./errors');

var _mic = require('./mic');

var _mic2 = _interopRequireDefault(_mic);

var _enums = require('./enums');

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

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
var hello = undefined;

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
    this.client = _client2.default.sharedInstance();
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
    key: 'isActiveUser',
    value: function isActiveUser() {
      var _this = this;

      return this.client.getActiveUser().then(function (activeUser) {
        if (activeUser && activeUser[idAttribute] === _this._id) {
          return true;
        }

        return false;
      });
    }

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

  }, {
    key: 'login',
    value: function login(usernameOrData, password) {
      var _this2 = this;

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

      var promise = this.isActiveUser().then(function (isActiveUser) {
        if (isActiveUser) {
          throw new _errors.ActiveUserError('This user is already the active user.');
        }

        return _this2.client.getActiveUser();
      }).then(function (activeUser) {
        if (activeUser) {
          throw new _errors.ActiveUserError('An active user already exists. ' + 'Please call logout the active user before you login.');
        }

        var _usernameOrData = usernameOrData;
        var username = _usernameOrData.username;
        var password = _usernameOrData.password;
        var _socialIdentity = _usernameOrData._socialIdentity;


        if ((!username || username === '' || !password || password === '') && !_socialIdentity) {
          throw new _errors.KinveyError('Username and/or password missing. ' + 'Please provide both a username and password to login.');
        }

        return _this2.client.executeNetworkRequest({
          method: _enums.HttpMethod.POST,
          pathname: '/' + usersNamespace + '/' + _this2.client.appKey + '/login',
          data: usernameOrData,
          auth: _this2.client.appAuth(),
          properties: options.properties,
          timeout: options.timeout
        });
      }).then(function (response) {
        return _this2.client.setActiveUser(response.data).then(function () {
          _this2.data = response.data;
          return _this2;
        });
      });

      return promise;
    }

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

  }, {
    key: 'loginWithMIC',
    value: function loginWithMIC(redirectUri, authorizationGrant) {
      var _this3 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return _mic2.default.login(redirectUri, authorizationGrant, options).then(function (token) {
        return _this3.connect(_mic2.default.identity, token.access_token, token.expires_in, options);
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
      var _this4 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this.client.executeNetworkRequest({
        method: _enums.HttpMethod.POST,
        pathname: '/' + usersNamespace + '/' + this.client.appKey + '/_logout',
        auth: this.client.sessionAuth(),
        properties: options.properties,
        timeout: options.timeout
      }).then(function () {
        return _this4.isActiveUser();
      }).catch(function () {
        return _this4.isActiveUser();
      }).then(function (isActiveUser) {
        if (isActiveUser) {
          return _this4.client.setActiveUser(null);
        }
      }).then(function () {
        return _this4;
      });
    }

    /**
     * @private
     * Returns true or false if identity connect is supported.
     *
     * @return {Boolean}  True or false if identity connect is supported.
     *
     * @example
     * var isIdentityConnectSupported = user.isIdentityConnectSupported();
     */

  }, {
    key: 'isIdentityConnectSupported',
    value: function isIdentityConnectSupported() {
      return hello ? true : false;
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

      return this.connectWithIdentity(_enums.SocialIdentity.Facebook, options);
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

      return this.connectWithIdentity(_enums.SocialIdentity.Google, options);
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

      return this.connectWithIdentity(_enums.SocialIdentity.LinkedIn, options);
    }

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

  }, {
    key: 'connectWithIdentity',
    value: function connectWithIdentity(identity) {
      var _this5 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!identity) {
        return Promise.reject(new _errors.KinveyError('An identity is required to connect the user.'));
      }

      if (this.isIdentityConnectSupported()) {
        return Promise.reject(new _errors.KinveyError('Unable to connect to identity ' + identity + ' on this platform.'));
      }

      options = (0, _assign2.default)({
        collectionName: 'Identities'
      }, options);

      var promise = Promise.resolve().then(function () {
        var query = new _query2.default().equalTo('identity', identity);
        return _this5.client.executeNetworkRequest({
          method: _enums.HttpMethod.GET,
          pathname: '/' + appdataNamespace + '/' + _this5.client.appKey + '/' + options.collectionName,
          auth: _this5.client.defaultAuth(),
          query: query,
          properties: options.properties,
          timeout: options.timeout
        });
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
        return _this5.connect(identity, authResponse.access_token, authResponse.expires_in, options);
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
     * var promise = user.connect(SocialIdentity.Facebook, 'facebook-access-token');
     * promise.then(function(user) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'connect',
    value: function connect(identity, accessToken, expiresIn) {
      var _this6 = this;

      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      options = (0, _assign2.default)({
        create: true
      }, options);

      var user = {};
      user[socialIdentityAttribute] = {};
      user[socialIdentityAttribute][identity] = {
        access_token: accessToken,
        expires_in: expiresIn
      };

      var promise = this.client.getActiveUser().then(function (activeUser) {
        if (activeUser) {
          activeUser[socialIdentityAttribute] = user[socialIdentityAttribute];
          options._identity = identity;
          return _this6.update(activeUser, options);
        }

        return _this6.login(user, null, options);
      }).catch(function (err) {
        if (options.create && err instanceof _errors.NotFoundError) {
          return _this6.signup(user, options).then(function () {
            return _this6.connect(identity, accessToken, expiresIn, options);
          });
        }
      });

      return promise;
    }

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

  }, {
    key: 'signup',
    value: function signup(data) {
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _assign2.default)({
        state: true
      }, options);

      var promise = Promise.resolve().then(function () {
        if (options.state === true) {
          return _this7.client.getActiveUser().then(function (activeUser) {
            if (activeUser) {
              throw new _errors.ActiveUserError('An active user already exists. ' + 'Please call logout the active user before you login.');
            }
          });
        }
      }).then(function () {
        return _this7.client.executeNetworkRequest({
          method: _enums.HttpMethod.POST,
          pathname: '/' + usersNamespace + '/' + _this7.client.appKey,
          auth: _this7.client.appAuth(),
          data: (0, _result2.default)(data, 'toJSON', data),
          properties: options.properties,
          timeout: options.timeout
        });
      }).then(function (response) {
        _this7.data = response.data;

        if (options.state === true) {
          return _this7.client.setActiveUser(_this7.data).then(function () {
            return _this7;
          });
        }

        return _this7;
      });

      return promise;
    }
  }, {
    key: 'update',
    value: function update(data) {
      var _this8 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var tokens = [];

      var promise = Promise.resolve().then(function () {
        if (!data[idAttribute]) {
          throw new _errors.KinveyError('data argument must contain an _id');
        }

        if (data[socialIdentityAttribute]) {
          for (var identity in data[socialIdentityAttribute]) {
            if (data[socialIdentityAttribute].hasOwnProperty(identity)) {
              if (data[socialIdentityAttribute][identity] && options._identity !== identity) {
                tokens.push({
                  identity: identity,
                  access_token: data[socialIdentityAttribute][identity].access_token,
                  access_token_secret: data[socialIdentityAttribute][identity].access_token_secret
                });
                delete data[socialIdentityAttribute][identity].access_token;
                delete data[socialIdentityAttribute][identity].access_token_secret;
              }
            }
          }
        }

        return _this8.client.executeNetworkRequest({
          method: _enums.HttpMethod.PUT,
          pathname: '/' + usersNamespace + '/' + _this8.client.appKey + '/' + data[idAttribute],
          auth: _this8.client.sessionAuth(),
          data: data,
          properties: options.properties,
          timeout: options.timeout
        });
      }).then(function (response) {
        var data = response.data;

        (0, _forEach2.default)(tokens, function (token) {
          var identity = token.identity;

          if (data[socialIdentityAttribute] && data[socialIdentityAttribute][identity]) {
            data[socialIdentityAttribute][identity].access_token = token.access_token;
            data[socialIdentityAttribute][identity].access_token_secret = token.access_token_secret;
          }
        });

        return _this8.client.getActiveUser().then(function (activeUser) {
          _this8.data = data;

          if (activeUser && data[idAttribute] === activeUser[idAttribute]) {
            return _this8.client.setActiveUser(data).then(function () {
              return _this8;
            });
          }

          return _this8;
        });
      });

      return promise;
    }
  }, {
    key: 'me',
    value: function me(options) {
      var _this9 = this;

      var promise = Promise.resolve().then(function () {
        return _this9.client.executeNetworkRequest({
          method: _enums.HttpMethod.GET,
          pathname: '/' + usersNamespace + '/' + _this9.client.appKey + '/_me',
          auth: _this9.client.sessionAuth(),
          properties: options.properties,
          timeout: options.timeout
        });
      }).then(function (response) {
        _this9.data = response.data;

        if (!_this9.authtoken) {
          return _this9.client.getActiveUser().then(function (activeUser) {
            if (activeUser) {
              _this9.authtoken = activeUser[kmdAttribute].authtoken;
            }

            return _this9;
          });
        }

        return _this9;
      }).then(function () {
        return _this9.client.setActiveUser(_this9.data);
      }).then(function () {
        return _this9;
      });

      return promise;
    }
  }, {
    key: 'verifyEmail',
    value: function verifyEmail(username, options) {
      var promise = this.client.executeNetworkRequest({
        method: _enums.HttpMethod.POST,
        pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/' + username + '/user-email-verification-initiate',
        auth: this.client.appAuth(),
        properties: options.properties,
        timeout: options.timeout
      });
      return promise;
    }
  }, {
    key: 'forgotUsername',
    value: function forgotUsername(email, options) {
      var promise = this.client.executeNetworkRequest({
        method: _enums.HttpMethod.POST,
        pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/user-forgot-username',
        auth: this.client.appAuth(),
        data: { email: email },
        properties: options.properties,
        timeout: options.timeout
      });
      return promise;
    }
  }, {
    key: 'resetPassword',
    value: function resetPassword(username, options) {
      var promise = this.client.executeNetworkRequest({
        method: _enums.HttpMethod.POST,
        pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/' + username + '/user-password-reset-initiate',
        auth: this.client.appAuth(),
        properties: options.properties,
        timeout: options.timeout
      });
      return promise;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return (0, _clone2.default)(this.data, true);
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
      return new _acl2.default(this.data);
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
      return new _metadata2.default(this.data);
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
      var kmd = this._kmd;
      kmd.authtoken = authtoken;
      this.data[kmdAttribute] = kmd.toJSON();
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
      var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

      return client.getActiveUser().then(function (data) {
        var user = null;

        if (data) {
          user = new User(data);
          user.client = client;
        }

        return user;
      });
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
      var client = arguments.length <= 1 || arguments[1] === undefined ? _client2.default.sharedInstance() : arguments[1];

      var data = (0, _result2.default)(user, 'toJSON', user);
      return client.setActiveUser(data).then(function () {
        return User.getActiveUser();
      });
    }
  }]);

  return User;
}();