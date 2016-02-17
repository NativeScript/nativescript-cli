'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _enums = require('./enums');

var _errors = require('./errors');

var _networkRequest = require('./requests/networkRequest');

var _networkRequest2 = _interopRequireDefault(_networkRequest);

var _device = require('./device');

var _device2 = _interopRequireDefault(_device);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _popup = require('./utils/popup');

var _popup2 = _interopRequireDefault(_popup);

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

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
 * @private
 */

var MobileIdentityConnect = function () {
  function MobileIdentityConnect() {
    _classCallCheck(this, MobileIdentityConnect);

    var sharedClient = _client2.default.sharedInstance();
    this.client = new _client2.default({
      protocol: 'https:',
      host: 'auth.kinvey.com',
      appKey: sharedClient.appKey,
      appSecret: sharedClient.appSecret,
      masterSecret: sharedClient.masterSecret,
      encryptionKey: sharedClient.encryptionKey
    });
  }

  _createClass(MobileIdentityConnect, [{
    key: 'login',
    value: function login(redirectUri) {
      var _this = this;

      var authorizationGrant = arguments.length <= 1 || arguments[1] === undefined ? _enums.AuthorizationGrant.AuthorizationCodeLoginPage : arguments[1];
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var clientId = this.client.appKey;
      var device = new _device2.default();

      var promise = Promise.resolve().then(function () {
        if (authorizationGrant === _enums.AuthorizationGrant.AuthorizationCodeLoginPage && !device.isNode()) {
          // Step 1: Request a code
          return _this.requestCodeWithPopup(clientId, redirectUri, options);
        } else if (authorizationGrant === _enums.AuthorizationGrant.AuthorizationCodeAPI && device.isNode()) {
          // Step 1a: Request a temp login url
          return _this.requestTempLoginUrl(clientId, redirectUri, options).then(function (url) {
            // Step 1b: Request a code
            return _this.requestCodeWithUrl(url, clientId, redirectUri, options);
          });
        }

        throw new _errors.KinveyError('The authorization grant ' + authorizationGrant + ' is unsupported. ' + 'Please use a supported authorization grant.');
      }).then(function (code) {
        // Step 3: Request a token
        return _this.requestToken(code, clientId, redirectUri, options);
      });

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

      var request = new _networkRequest2.default({
        method: _enums.HttpMethod.POST,
        url: this.client.getUrl(_path2.default.join(pathname, authPathname)),
        properties: options.properties,
        data: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code'
        }
      });
      request.setHeader('Content-Type', 'application/x-www-form-urlencoded');

      return request.execute().then(function (response) {
        if (response.isSuccess()) {
          return response.data.temp_login_uri;
        }

        throw response.error;
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

        var popup = new _popup2.default(_url2.default.format({
          protocol: _this2.client.protocl,
          host: _this2.client.host,
          pathname: _path2.default.join(pathname, authPathname),
          query: {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code'
          }
        }));
        return popup.open();
      }).then(function (popup) {
        return new Promise(function (resolve, reject) {
          function loadHandler(loadedUrl) {
            if (loadedUrl.indexOf(redirectUri) === 0) {
              popup.removeAllListeners();
              popup.close();
              resolve(_url2.default.parse(loadedUrl, true).query.code);
            }
          }

          function closeHandler() {
            popup.removeAllListeners();
            reject(new Error('Login has been cancelled.'));
          }

          popup.on('load', loadHandler);
          popup.on('close', closeHandler);
        });
      });

      return promise;
    }
  }, {
    key: 'requestCodeWithUrl',
    value: function requestCodeWithUrl(loginUrl, clientId, redirectUri) {
      var _this3 = this;

      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      var promise = Promise.resolve().then(function () {
        var client = new _client2.default({
          protocol: _url2.default.parse(loginUrl).protocol,
          host: _url2.default.parse(loginUrl).host,
          appKey: _this3.client.appKey,
          appSecret: _this3.client.appSecret,
          masterSecret: _this3.client.masterSecret,
          encryptionKey: _this3.client.encryptionKey
        });
        var request = new _networkRequest2.default({
          method: _enums.HttpMethod.POST,
          url: client.getUrl(_url2.default.parse(loginUrl).pathname, _url2.default.parse(loginUrl, true).query),
          properties: options.properties,
          auth: _auth2.default.app,
          data: {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            username: options.username,
            password: options.password
          },
          followRedirect: false
        });
        request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        return request.execute();
      }).then(function (response) {
        var location = response.getHeader('location');

        if (location) {
          return _url2.default.parse(location, true).query.code;
        }

        throw new _errors.KinveyError('Unable to authorize user with username ' + options.username + '.');
      });

      return promise;
    }
  }, {
    key: 'requestToken',
    value: function requestToken(code, clientId, redirectUri) {
      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      var request = new _networkRequest2.default({
        method: _enums.HttpMethod.POST,
        url: this.client(tokenPathname),
        properties: options.properties,
        auth: _auth2.default.app,
        data: {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code: code
        }
      });
      request.setHeader('Content-Type', 'application/x-www-form-urlencoded');

      return request.execute().then(function (response) {
        if (response.isSuccess()) {
          return response.data;
        }

        throw response.error;
      });
    }
  }]);

  return MobileIdentityConnect;
}();

exports.default = MobileIdentityConnect;