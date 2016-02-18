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

var _errors = require('./errors');

var _mic = require('./mic');

var _mic2 = _interopRequireDefault(_mic);

var _enums = require('./enums');

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var micAuthProvider = process.env.KINVEY_MIC_AUTH_PROVIDER || 'kinveyAuth';
var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
var usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
var rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
var socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
var hello = undefined;

if (typeof window !== 'undefined') {
  hello = require('hellojs');
}

var User = exports.User = function () {
  function User() {
    _classCallCheck(this, User);

    /**
     * @private
     * @type {Client}
     */
    this.client = _client2.default.sharedInstance();
  }

  _createClass(User, [{
    key: 'login',
    value: function login(usernameOrData, password) {
      var _this = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!(0, _isObject2.default)(usernameOrData)) {
        usernameOrData = {
          username: usernameOrData,
          password: password
        };
      }
      usernameOrData.username = String(usernameOrData.username).trim();
      usernameOrData.password = String(usernameOrData.password).trim();

      var promise = this.client.getActiveUser().then(function (activeUser) {
        if (activeUser) {
          throw new _errors.ActiveUserError('An active session already exists. ' + 'Please call `Kinvey.User.logout()` before you login.');
        }

        var _usernameOrData = usernameOrData;
        var username = _usernameOrData.username;
        var password = _usernameOrData.password;
        var _socialIdentity = _usernameOrData._socialIdentity;


        if ((!username || username === '' || !password || password === '') && !_socialIdentity) {
          throw new _errors.KinveyError('Username and/or password missing. ' + 'Please provide both a username and password to login.');
        }

        return _this.client.executeNetworkRequest({
          method: _enums.HttpMethod.POST,
          pathname: '/' + usersNamespace + '/' + _this.client.appKey + '/login',
          data: usernameOrData,
          auth: _this.client.appAuth(),
          properties: options.properties,
          timeout: options.timeout
        });
      }).then(function (response) {
        return _this.client.setActiveUser(response.data);
      });

      return promise;
    }
  }, {
    key: 'loginWithMIC',
    value: function loginWithMIC(redirectUri, authorizationGrant, options) {
      var _this2 = this;

      return _mic2.default.login(redirectUri, authorizationGrant, options).then(function (token) {
        return _this2.connect(token.access_token, token.expires_in, micAuthProvider, options);
      });
    }
  }, {
    key: 'logout',
    value: function logout() {
      var _this3 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this.client.executeNetworkRequest({
        method: _enums.HttpMethod.POST,
        pathname: '/' + usersNamespace + '/' + this.client.appKey + '/_logout',
        auth: this.client.sessionAuth(),
        properties: options.properties,
        timeout: options.timeout
      }).then(function () {
        return _this3.client.setActiveUser(null);
      }).catch(function () {
        return _this3.client.setActiveUser(null);
      });
    }
  }, {
    key: 'isSocialIdentityConnectSupported',
    value: function isSocialIdentityConnectSupported() {
      return hello ? true : false;
    }
  }, {
    key: 'connectWithFacebook',
    value: function connectWithFacebook(options) {
      return this.connectWithSocialIdentity(_enums.SocialIdentity.Facebook, options);
    }
  }, {
    key: 'connectWithGoogle',
    value: function connectWithGoogle(options) {
      return this.connectWithSocialIdentity(_enums.SocialIdentity.Google, options);
    }
  }, {
    key: 'connectWithLinkedIn',
    value: function connectWithLinkedIn(options) {
      return this.connectWithSocialIdentity(_enums.SocialIdentity.LinkedIn, options);
    }
  }, {
    key: 'connectWithSocialIdentity',
    value: function connectWithSocialIdentity(identity) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (this.isSocialIdentityConnectSupported()) {
        return Promise.reject(new _errors.KinveyError('Unable to connect to social identity ' + identity + ' on this platform.'));
      }

      options = (0, _assign2.default)({
        collectionName: 'SocialIdentities',
        handler: function handler() {}
      }, options);

      var promise = Promise.resolve().then(function () {
        var query = new _query2.default().equalTo('identity', identity);
        return _this4.client.executeNetworkRequest({
          method: _enums.HttpMethod.GET,
          pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + options.collectionName,
          auth: _this4.client.defaultAuth(),
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

        throw new _errors.KinveyError('Unsupported social identity');
      }).then(function () {
        var authResponse = hello(identity).getAuthResponse();
        return _this4.connect(authResponse.access_token, authResponse.expires_in, identity, options);
      });

      return promise;
    }
  }, {
    key: 'connect',
    value: function connect(accessToken, expiresIn, identity) {
      var _this5 = this;

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
          return _this5.update(activeUser, options);
        }

        return _this5.login(user, null, options);
      }).catch(function (err) {
        if (options.create && err instanceof _errors.NotFoundError) {
          return _this5.signup(user, options).then(function () {
            return _this5.connect(accessToken, expiresIn, identity, options);
          });
        }
      });

      return promise;
    }
  }, {
    key: 'signup',
    value: function signup(data) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _assign2.default)({
        state: true
      }, options);

      var promise = Promise.resolve().then(function () {
        if (options.state === true) {
          return _this6.client.getActiveUser().then(function (activeUser) {
            if (activeUser) {
              throw new _errors.ActiveUserError('An active session already exists. ' + 'Please call `Kinvey.User.logout()` before you login.');
            }
          });
        }
      }).then(function () {
        return _this6.client.executeNetworkRequest({
          method: _enums.HttpMethod.POST,
          pathname: '/' + usersNamespace + '/' + _this6.client.appKey,
          auth: _this6.client.appAuth(),
          data: data,
          properties: options.properties,
          timeout: options.timeout
        });
      }).then(function (response) {
        if (options.state === true) {
          _this6.client.setActiveUser(response.data);
        }

        return response.data;
      });

      return promise;
    }
  }, {
    key: 'update',
    value: function update(data) {
      var _this7 = this;

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

        return _this7.client.executeNetworkRequest({
          method: _enums.HttpMethod.PUT,
          pathname: '/' + usersNamespace + '/' + _this7.client.appKey + '/' + data[idAttribute],
          auth: _this7.client.sessionAuth(),
          data: data,
          properties: options.properties,
          timeout: options.timeout
        });
      }).then(function (response) {
        var user = response.data;

        (0, _forEach2.default)(tokens, function (token) {
          var identity = token.identity;

          if (user[socialIdentityAttribute] && user[socialIdentityAttribute][identity]) {
            user[socialIdentityAttribute][identity].access_token = token.access_token;
            user[socialIdentityAttribute][identity].access_token_secret = token.access_token_secret;
          }
        });

        return _this7.client.getActiveUser().then(function (activeUser) {
          if (activeUser && user[idAttribute] === activeUser[idAttribute]) {
            return _this7.client.setActiveUser(user);
          }

          return user;
        });
      });

      return promise;
    }
  }, {
    key: 'me',
    value: function me(options) {
      var _this8 = this;

      var promise = Promise.resolve().then(function () {
        return _this8.client.executeNetworkRequest({
          method: _enums.HttpMethod.GET,
          pathname: '/' + usersNamespace + '/' + _this8.client.appKey + '/_me',
          auth: _this8.client.sessionAuth(),
          properties: options.properties,
          timeout: options.timeout
        });
      }).then(function (response) {
        var user = response.data;
        user[kmdAttribute] = user[kmdAttribute] || {};

        if (!user[kmdAttribute].authtoken) {
          return _this8.client.getActiveUser().then(function (activeUser) {
            if (activeUser) {
              user[kmdAttribute].authtoken = activeUser[kmdAttribute].authtoken;
            }

            return user;
          });
        }

        return user;
      }).then(function (user) {
        return _this8.client.setActiveUser(user);
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
  }], [{
    key: 'getActiveUser',
    value: function getActiveUser() {
      var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

      return client.getActiveUser();
    }
  }, {
    key: 'setActiveUser',
    value: function setActiveUser(user) {
      var client = arguments.length <= 1 || arguments[1] === undefined ? _client2.default.sharedInstance() : arguments[1];

      return client.setActiveUser(user);
    }
  }, {
    key: 'logout',
    value: function logout() {
      var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return client.getActiveUser().then(function (activeUser) {
        if (!activeUser) {
          return null;
        }

        var user = new User();
        user.client = client;
        return user.logout(options);
      });
    }
  }]);

  return User;
}();