'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('../../client');

var _acl = require('./acl');

var _acl2 = _interopRequireDefault(_acl);

var _metadata = require('./metadata');

var _metadata2 = _interopRequireDefault(_metadata);

var _request = require('../../request');

var _errors = require('../../errors');

var _datastore = require('../../datastore');

var _datastore2 = _interopRequireDefault(_datastore);

var _identity = require('../../identity');

var _utils = require('../../utils');

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var usersNamespace = process && process.env && process.env.KINVEY_USERS_NAMESPACE || 'user' || 'user';
var rpcNamespace = process && process.env && process.env.KINVEY_RPC_NAMESPACE || 'rpc' || 'rpc';
var idAttribute = process && process.env && process.env.KINVEY_ID_ATTRIBUTE || '_id' || '_id';
var kmdAttribute = process && process.env && process.env.KINVEY_KMD_ATTRIBUTE || '_kmd' || '_kmd';
var socialIdentityAttribute = process && process.env && process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity' || '_socialIdentity';
var usernameAttribute = process && process.env && process.env.KINVEY_USERNAME_ATTRIBUTE || 'username' || 'username';
var emailAttribute = process && process.env && process.env.KINVEY_EMAIL_ATTRIBUTE || 'email' || 'email';

var User = function () {
  function User() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, User);

    this.data = data;

    this.client = options.client || _client.Client.sharedInstance();
  }

  _createClass(User, [{
    key: 'isActive',
    value: function isActive() {
      var activeUser = User.getActiveUser(this.client);

      if ((0, _utils.isDefined)(activeUser) && activeUser._id === this._id) {
        return true;
      }

      return false;
    }
  }, {
    key: 'isEmailVerified',
    value: function isEmailVerified() {
      var status = this.metadata.emailVerification;
      return status === 'confirmed';
    }
  }, {
    key: 'login',
    value: function login(username, password) {
      var _this = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var credentials = username;
      var isActive = this.isActive();
      var activeUser = User.getActiveUser(this.client);

      if (isActive === true) {
        return _es6Promise2.default.reject(new _errors.ActiveUserError('This user is already the active user.'));
      }

      if ((0, _utils.isDefined)(activeUser)) {
        return _es6Promise2.default.reject(new _errors.ActiveUserError('An active user already exists. Please logout the active user before you login.'));
      }

      if ((0, _isObject2.default)(credentials)) {
        options = password || {};
      } else {
        credentials = {
          username: username,
          password: password
        };
      }

      if ((0, _utils.isDefined)(credentials.username)) {
        credentials.username = String(credentials.username).trim();
      }

      if ((0, _utils.isDefined)(credentials.password)) {
        credentials.password = String(credentials.password).trim();
      }

      if ((!(0, _utils.isDefined)(credentials.username) || credentials.username === '' || !(0, _utils.isDefined)(credentials.password) || credentials.password === '') && !(0, _utils.isDefined)(credentials._socialIdentity)) {
        return _es6Promise2.default.reject(new _errors.KinveyError('Username and/or password missing. Please provide both a username and password to login.'));
      }

      var request = new _request.KinveyRequest({
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

      return request.execute().then(function (response) {
        return response.data;
      }).then(function (data) {
        if ((0, _utils.isDefined)(credentials._socialIdentity) && (0, _utils.isDefined)(data._socialIdentity)) {
          var identities = Object.keys(data._socialIdentity);
          identities.forEach(function (identity) {
            data._socialIdentity[identity] = (0, _assign2.default)({}, credentials._socialIdentity[identity], data._socialIdentity[identity]);
          });
          data._socialIdentity = (0, _assign2.default)({}, credentials._socialIdentity, data._socialIdentity);
        }

        _this.data = data;
        return _request.CacheRequest.setActiveUser(_this.client, _this.data);
      }).then(function () {
        return _this;
      });
    }
  }, {
    key: 'loginWithMIC',
    value: function loginWithMIC(redirectUri, authorizationGrant) {
      var _this2 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var isActive = this.isActive();
      var activeUser = User.getActiveUser(this.client);

      if (isActive) {
        throw new _errors.ActiveUserError('This user is already the active user.');
      }

      if ((0, _utils.isDefined)(activeUser)) {
        throw new _errors.ActiveUserError('An active user already exists. Please logout the active user before you login.');
      }

      var mic = new _identity.MobileIdentityConnect({ client: this.client });
      return mic.login(redirectUri, authorizationGrant, options).then(function (session) {
        return _this2.connectIdentity(_identity.MobileIdentityConnect.identity, session, options);
      });
    }
  }, {
    key: 'connectIdentity',
    value: function connectIdentity(identity, session) {
      var _this3 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var isActive = this.isActive();
      var data = {};
      var socialIdentity = data[socialIdentityAttribute] || {};
      socialIdentity[identity] = session;
      data[socialIdentityAttribute] = socialIdentity;

      if (isActive) {
        return this.update(data, options);
      }

      return this.login(data, options).catch(function (error) {
        if (error instanceof _errors.NotFoundError) {
          return _this3.signup(data, options).then(function () {
            return _this3.connectIdentity(identity, session, options);
          });
        }

        throw error;
      });
    }
  }, {
    key: 'connectWithIdentity',
    value: function connectWithIdentity(identity, session) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this.connectIdentity(identity, session, options);
    }
  }, {
    key: 'connectFacebook',
    value: function connectFacebook(clientId) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var facebook = new _identity.Facebook({ client: this.client });
      return facebook.login(clientId, options).then(function (session) {
        return _this4.connectIdentity(_identity.Facebook.identity, session, options);
      });
    }
  }, {
    key: 'disconnectFacebook',
    value: function disconnectFacebook() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.disconnectIdentity(_identity.Facebook.identity, options);
    }
  }, {
    key: 'connectGoogle',
    value: function connectGoogle(clientId) {
      var _this5 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var google = new _identity.Google({ client: this.client });
      return google.login(clientId, options).then(function (session) {
        return _this5.connectIdentity(_identity.Google.identity, session, options);
      });
    }
  }, {
    key: 'disconnectGoogle',
    value: function disconnectGoogle() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.disconnectIdentity(_identity.Google.identity, options);
    }
  }, {
    key: 'googleconnectLinkedIn',
    value: function googleconnectLinkedIn(clientId) {
      var _this6 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var linkedIn = new _identity.LinkedIn({ client: this.client });
      return linkedIn.login(clientId, options).then(function (session) {
        return _this6.connectIdentity(_identity.LinkedIn.identity, session, options);
      });
    }
  }, {
    key: 'disconnectLinkedIn',
    value: function disconnectLinkedIn() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.disconnectIdentity(_identity.LinkedIn.identity, options);
    }
  }, {
    key: 'disconnectIdentity',
    value: function disconnectIdentity(identity) {
      var _this7 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var promise = _es6Promise2.default.resolve();

      if (identity === _identity.Facebook.identity) {
        promise = _identity.Facebook.logout(this, options);
      } else if (identity === _identity.Google.identity) {
        promise = _identity.Google.logout(this, options);
      } else if (identity === _identity.LinkedIn.identity) {
        promise = _identity.LinkedIn.logout(this, options);
      } else if (identity === _identity.MobileIdentityConnect.identity) {
        promise = _identity.MobileIdentityConnect.logout(this, options);
      }

      return promise.catch(function (error) {
        _utils.Log.error(error);
      }).then(function () {
        var data = _this7.data;
        var socialIdentity = data[socialIdentityAttribute] || {};
        delete socialIdentity[identity];
        data[socialIdentityAttribute] = socialIdentity;
        _this7.data = data;

        if (!_this7[idAttribute]) {
          return _this7;
        }

        return _this7.update(data, options);
      }).then(function () {
        return _this7;
      });
    }
  }, {
    key: 'logout',
    value: function logout() {
      var _this8 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var request = new _request.KinveyRequest({
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

      return request.execute().catch(function (error) {
        _utils.Log.error(error);
        return null;
      }).then(function () {
        return _request.CacheRequest.setActiveUser(_this8.client, null);
      }).catch(function (error) {
        _utils.Log.error(error);
        return null;
      }).then(function () {
        return _datastore2.default.clearCache({ client: _this8.client });
      }).catch(function (error) {
        _utils.Log.error(error);
        return null;
      }).then(function () {
        return _this8;
      });
    }
  }, {
    key: 'signup',
    value: function signup(data) {
      var _this9 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var activeUser = User.getActiveUser(this.client);
      options = (0, _assign2.default)({
        state: true
      }, options);

      if (options.state === true && (0, _utils.isDefined)(activeUser)) {
        throw new _errors.ActiveUserError('An active user already exists. Please logout the active user before you login.');
      }

      if (data instanceof User) {
        data = data.data;
      }

      var request = new _request.KinveyRequest({
        method: _request.RequestMethod.POST,
        authType: _request.AuthType.App,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname
        }),
        body: (0, _isEmpty2.default)(data) ? null : data,
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });

      return request.execute().then(function (response) {
        return response.data;
      }).then(function (data) {
        _this9.data = data;

        if (options.state === true) {
          return _request.CacheRequest.setActiveUser(_this9.client, _this9.data);
        }

        return _this9;
      }).then(function () {
        return _this9;
      });
    }
  }, {
    key: 'signupWithIdentity',
    value: function signupWithIdentity(identity, session) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var data = {};
      data[socialIdentityAttribute] = {};
      data[socialIdentityAttribute][identity] = session;
      return this.signup(data, options);
    }
  }, {
    key: 'update',
    value: function update(data) {
      var _this10 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      data = (0, _assign2.default)(this.data, data);
      return _datastore.UserStore.update(data, options).then(function (data) {
        if (_this10.isActive()) {
          return _request.CacheRequest.setActiveUser(_this10.client, data);
        }

        return data;
      }).then(function (data) {
        _this10.data = data;
        return _this10;
      });
    }
  }, {
    key: 'me',
    value: function me() {
      var _this11 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var request = new _request.KinveyRequest({
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

      return request.execute().then(function (response) {
        return response.data;
      }).then(function (data) {
        if (!(0, _utils.isDefined)(data[kmdAttribute].authtoken)) {
          var activeUser = User.getActiveUser(_this11.client);

          if ((0, _utils.isDefined)(activeUser)) {
            data[kmdAttribute].authtoken = activeUser.authtoken;
          }

          return data;
        }

        return data;
      }).then(function (data) {
        _this11.data = data;
        return _request.CacheRequest.setActiveUser(_this11.client, data);
      }).then(function () {
        return _this11;
      });
    }
  }, {
    key: '_id',
    get: function get() {
      return this.data[idAttribute];
    }
  }, {
    key: '_acl',
    get: function get() {
      return new _acl2.default(this.data);
    }
  }, {
    key: 'metadata',
    get: function get() {
      return new _metadata2.default(this.data);
    },
    set: function set(metadata) {
      this.data[kmdAttribute] = (0, _result2.default)(metadata, 'toPlainObjecta', metadata);
    }
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
  }, {
    key: 'authtoken',
    get: function get() {
      return this.metadata.authtoken;
    },
    set: function set(authtoken) {
      var metadata = this.metadata;
      metadata.authtoken = authtoken;
      this.metadata = metadata;
    }
  }, {
    key: 'username',
    get: function get() {
      return this.data[usernameAttribute];
    }
  }, {
    key: 'email',
    get: function get() {
      return this.data[emailAttribute];
    }
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appKey;
    }
  }], [{
    key: 'getActiveUser',
    value: function getActiveUser() {
      var client = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _client.Client.sharedInstance();

      var data = _request.CacheRequest.getActiveUser(client);

      if ((0, _utils.isDefined)(data)) {
        return new this(data, { client: client });
      }

      return null;
    }
  }, {
    key: 'login',
    value: function login(username, password) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var user = new this({}, options);
      return user.login(username, password, options);
    }
  }, {
    key: 'loginWithMIC',
    value: function loginWithMIC(redirectUri, authorizationGrant) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var user = new this({}, options);
      return user.loginWithMIC(redirectUri, authorizationGrant, options);
    }
  }, {
    key: 'connectIdentity',
    value: function connectIdentity(identity, session) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var user = new this({}, options);
      return user.connectIdentity(identity, session, options);
    }
  }, {
    key: 'connectFacebook',
    value: function connectFacebook(clientId) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var user = new this({}, options);
      return user.connectFacebook(clientId, options);
    }
  }, {
    key: 'connectGoogle',
    value: function connectGoogle(clientId) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var user = new this({}, options);
      return user.connectGoogle(clientId, options);
    }
  }, {
    key: 'connectLinkedIn',
    value: function connectLinkedIn(clientId) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var user = new this({}, options);
      return user.connectLinkedIn(clientId, options);
    }
  }, {
    key: 'logout',
    value: function logout() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var activeUser = User.getActiveUser(options.client);

      if ((0, _utils.isDefined)(activeUser)) {
        return activeUser.logout(options);
      }

      return _es6Promise2.default.resolve(null);
    }
  }, {
    key: 'signup',
    value: function signup(data) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var user = new this({}, options);
      return user.signup(data, options);
    }
  }, {
    key: 'signupWithIdentity',
    value: function signupWithIdentity(identity, session) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var user = new this({}, options);
      return user.signupWithIdentity(identity, session, options);
    }
  }, {
    key: 'update',
    value: function update(data) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var activeUser = User.getActiveUser(options.client);

      if ((0, _utils.isDefined)(activeUser)) {
        return activeUser.update(data, options);
      }

      return _es6Promise2.default.resolve(null);
    }
  }, {
    key: 'me',
    value: function me() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var activeUser = User.getActiveUser(options.client);

      if (activeUser) {
        return activeUser.me(options);
      }

      return _es6Promise2.default.resolve(null);
    }
  }, {
    key: 'verifyEmail',
    value: function verifyEmail(username) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!username) {
        return _es6Promise2.default.reject(new _errors.KinveyError('A username was not provided.', 'Please provide a username for the user that you would like to verify their email.'));
      }

      if (!(0, _isString2.default)(username)) {
        return _es6Promise2.default.reject(new _errors.KinveyError('The provided username is not a string.'));
      }

      var client = options.client || _client.Client.sharedInstance();
      var request = new _request.KinveyRequest({
        method: _request.RequestMethod.POST,
        authType: _request.AuthType.App,
        url: _url2.default.format({
          protocol: client.protocol,
          host: client.host,
          pathname: '/' + rpcNamespace + '/' + client.appKey + '/' + username + '/user-email-verification-initiate'
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: client
      });
      return request.execute().then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'forgotUsername',
    value: function forgotUsername(email) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!email) {
        return _es6Promise2.default.reject(new _errors.KinveyError('An email was not provided.', 'Please provide an email for the user that you would like to retrieve their username.'));
      }

      if (!(0, _isString2.default)(email)) {
        return _es6Promise2.default.reject(new _errors.KinveyError('The provided email is not a string.'));
      }

      var client = options.client || _client.Client.sharedInstance();
      var request = new _request.KinveyRequest({
        method: _request.RequestMethod.POST,
        authType: _request.AuthType.App,
        url: _url2.default.format({
          protocol: client.protocol,
          host: client.host,
          pathname: '/' + rpcNamespace + '/' + client.appKey + '/user-forgot-username'
        }),
        properties: options.properties,
        data: { email: email },
        timeout: options.timeout,
        client: client
      });
      return request.execute().then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'resetPassword',
    value: function resetPassword(username) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!username) {
        return _es6Promise2.default.reject(new _errors.KinveyError('A username was not provided.', 'Please provide a username for the user that you would like to verify their email.'));
      }

      if (!(0, _isString2.default)(username)) {
        return _es6Promise2.default.reject(new _errors.KinveyError('The provided username is not a string.'));
      }

      var client = options.client || _client.Client.sharedInstance();
      var request = new _request.KinveyRequest({
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
      return request.execute().then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'lookup',
    value: function lookup(query) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return _datastore.UserStore.lookup(query, options);
    }
  }, {
    key: 'exists',
    value: function exists(username) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return _datastore.UserStore.exists(username, options);
    }
  }, {
    key: 'restore',
    value: function restore(id) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return _datastore.UserStore.restore(id, options);
    }
  }]);

  return User;
}();

exports.default = User;