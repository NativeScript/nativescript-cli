'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MobileIdentityConnect = exports.SocialIdentity = exports.AuthorizationGrant = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _network = require('./requests/network');

var _request = require('./requests/request');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var authPathname = process.env.KINVEY_MIC_AUTH_PATHNAME || '/oauth/auth';
var tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';

/**
 * Enum for Mobile Identity Connect authorization grants.
 */
var AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
Object.freeze(AuthorizationGrant);
exports.AuthorizationGrant = AuthorizationGrant;

/**
 * Enum for Social Identities.
 */

var SocialIdentity = {
  Facebook: 'facebook',
  Google: 'google',
  LinkedIn: 'linkedin'
};
Object.freeze(SocialIdentity);
exports.SocialIdentity = SocialIdentity;

/**
 * @private
 */

var MobileIdentityConnect = exports.MobileIdentityConnect = function () {
  function MobileIdentityConnect() {
    var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

    _classCallCheck(this, MobileIdentityConnect);

    this.client = new _client2.default({
      protocol: process.env.KINVEY_MIC_PROTOCOL || 'https:',
      host: process.env.KINVEY_MIC_HOST || 'auth.kinvey.com',
      appKey: client.appKey,
      appSecret: client.appSecret,
      masterSecret: client.masterSecret,
      encryptionKey: client.encryptionKey
    });
  }

  _createClass(MobileIdentityConnect, [{
    key: 'login',
    value: function login(redirectUri) {
      var _this = this;

      var authorizationGrant = arguments.length <= 1 || arguments[1] === undefined ? AuthorizationGrant.AuthorizationCodeLoginPage : arguments[1];
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var clientId = this.client.appKey;

      var promise = Promise.resolve().then(function () {
        if (authorizationGrant === AuthorizationGrant.AuthorizationCodeLoginPage) {
          // Step 1: Request a code
          return _this.requestCodeWithPopup(clientId, redirectUri, options);
        } else if (authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI) {
          // Step 1a: Request a temp login url
          return _this.requestTempLoginUrl(clientId, redirectUri, options).then(function (url) {
            return _this.requestCodeWithUrl(url, clientId, redirectUri, options);
          }); // Step 1b: Request a code
        }

        throw new _errors.KinveyError('The authorization grant ' + authorizationGrant + ' is unsupported. ' + 'Please use a supported authorization grant.');
      }).then(function (code) {
        return _this.requestToken(code, clientId, redirectUri, options);
      }); // Step 3: Request a token

      return promise;
    }
  }, {
    key: 'requestTempLoginUrl',
    value: function requestTempLoginUrl(clientId, redirectUri) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var pathname = '/';

      if (options.version) {
        var version = options.version;

        if (!(0, _isString2.default)(version)) {
          version = String(version);
        }

        pathname = _path2.default.join(pathname, version.indexOf('v') === 0 ? version : 'v' + version);
      }

      var config = new _request.KinveyRequestConfig({
        method: _request.RequestMethod.POST,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: _path2.default.join(pathname, authPathname)
        }),
        properties: options.properties,
        body: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code'
        }
      });
      config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
      var request = new _network.NetworkRequest(config);
      return request.execute().then(function (response) {
        return response.data.temp_login_uri;
      });
    }
  }, {
    key: 'requestCodeWithPopup',
    value: function requestCodeWithPopup(clientId, redirectUri) {
      var _this2 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var promise = Promise.resolve().then(function () {
        var pathname = '/';

        if (options.version) {
          var version = options.version;

          if (!(0, _isString2.default)(version)) {
            version = String(version);
          }

          pathname = _path2.default.join(pathname, version.indexOf('v') === 0 ? version : 'v' + version);
        }

        if (global.KinveyPopup) {
          var popup = new global.KinveyPopup();
          return popup.open(_url2.default.format({
            protocol: _this2.client.protocol,
            host: _this2.client.host,
            pathname: _path2.default.join(pathname, authPathname),
            query: {
              client_id: clientId,
              redirect_uri: redirectUri,
              response_type: 'code'
            }
          }));
        }

        throw new _errors.KinveyError('KinveyPopup is undefined.' + (' Unable to login authorization grant ' + AuthorizationGrant.AuthorizationCodeLoginPage + '.'));
      }).then(function (popup) {
        var promise = new Promise(function (resolve, reject) {
          var redirected = false;

          function loadedCallback(loadedUrl) {
            if (loadedUrl.indexOf(redirectUri) === 0) {
              redirected = true;
              popup.removeAllListeners();
              popup.close();
              resolve(_url2.default.parse(loadedUrl, true).query.code);
            }
          }

          function errorCallback(message) {
            popup.removeAllListeners();
            popup.close();
            reject(new Error(message));
          }

          function closedCallback() {
            popup.removeAllListeners();

            if (!redirected) {
              reject(new Error('Login has been cancelled.'));
            }
          }

          popup.on('loaded', loadedCallback);
          popup.on('error', errorCallback);
          popup.on('closed', closedCallback);
        });
        return promise;
      });

      return promise;
    }
  }, {
    key: 'requestCodeWithUrl',
    value: function requestCodeWithUrl(loginUrl, clientId, redirectUri) {
      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      var promise = Promise.resolve().then(function () {
        var config = new _request.KinveyRequestConfig({
          method: _request.RequestMethod.POST,
          url: loginUrl,
          properties: options.properties,
          body: {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            username: options.username,
            password: options.password
          },
          followRedirect: false
        });
        config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
        var request = new _network.NetworkRequest(config);
        return request.execute();
      }).then(function (response) {
        var location = response.getHeader('location');

        if (location) {
          return _url2.default.parse(location, true).query.code;
        }

        throw new _errors.KinveyError('Unable to authorize user with username ' + options.username + '.', 'A location header was not provided with a code to exchange for an auth token.');
      });

      return promise;
    }
  }, {
    key: 'requestToken',
    value: function requestToken(code, clientId, redirectUri) {
      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      var config = new _request.KinveyRequestConfig({
        method: _request.RequestMethod.POST,
        authType: _request.AuthType.App,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: tokenPathname
        }),
        properties: options.properties,
        body: {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code: code
        }
      });
      config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
      var request = new _network.NetworkRequest(config);
      request.automaticallyRefreshAuthToken = false;
      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
    }
  }], [{
    key: 'identity',
    get: function get() {
      return process.env.KINVEY_MIC_IDENTITY || 'kinveyAuth';
    }
  }]);

  return MobileIdentityConnect;
}();