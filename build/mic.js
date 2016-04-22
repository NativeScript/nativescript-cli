'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MobileIdentityConnect = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _enums = require('./enums');

var _errors = require('./errors');

var _network = require('./requests/network');

var _client = require('./client');

var _popup = require('./utils/popup');

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

var MobileIdentityConnect = exports.MobileIdentityConnect = function () {
  function MobileIdentityConnect() {
    var client = arguments.length <= 0 || arguments[0] === undefined ? _client.Client.sharedInstance() : arguments[0];

    _classCallCheck(this, MobileIdentityConnect);

    this.client = new _client.Client({
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

      var authorizationGrant = arguments.length <= 1 || arguments[1] === undefined ? _enums.AuthorizationGrant.AuthorizationCodeLoginPage : arguments[1];
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var clientId = this.client.appKey;

      var promise = _babybird2.default.resolve().then(function () {
        if (authorizationGrant === _enums.AuthorizationGrant.AuthorizationCodeLoginPage) {
          // Step 1: Request a code
          return _this.requestCodeWithPopup(clientId, redirectUri, options);
        } else if (authorizationGrant === _enums.AuthorizationGrant.AuthorizationCodeAPI) {
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

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: _path2.default.join(pathname, authPathname)
        }),
        properties: options.properties,
        data: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code'
        }
      });
      return request.execute().then(function (response) {
        return response.data.temp_login_uri;
      });
    }
  }, {
    key: 'requestCodeWithPopup',
    value: function requestCodeWithPopup(clientId, redirectUri) {
      var _this2 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var promise = _babybird2.default.resolve().then(function () {
        var pathname = '/';

        if (options.version) {
          var version = options.version;

          if (!(0, _isString2.default)(version)) {
            version = String(version);
          }

          pathname = _path2.default.join(pathname, version.indexOf('v') === 0 ? version : 'v' + version);
        }

        var popup = new _popup.Popup();
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
      }).then(function (popup) {
        var promise = new _babybird2.default(function (resolve, reject) {
          var redirected = false;

          function loadHandler(loadedUrl) {
            if (loadedUrl.indexOf(redirectUri) === 0) {
              redirected = true;
              popup.removeAllListeners();
              popup.close();
              resolve(_url2.default.parse(loadedUrl, true).query.code);
            }
          }

          function closeHandler() {
            popup.removeAllListeners();

            if (!redirected) {
              reject(new Error('Login has been cancelled.'));
            }
          }

          popup.on('loaded', loadHandler);
          popup.on('closed', closeHandler);
        });
        return promise;
      });

      return promise;
    }
  }, {
    key: 'requestCodeWithUrl',
    value: function requestCodeWithUrl(loginUrl, clientId, redirectUri) {
      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _network.NetworkRequest({
          method: _enums.HttpMethod.POST,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          url: loginUrl,
          properties: options.properties,
          data: {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            username: options.username,
            password: options.password
          },
          followRedirect: false
        });
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

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        authType: _enums.AuthType.App,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: tokenPathname
        }),
        properties: options.properties,
        data: {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code: code
        }
      });
      request.automaticallyRefreshAuthToken = false;

      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
    }

    // refresh(token, options) {
    //   const clientId = this.client.appKey;
    //   return this.refreshToken(clientId, token, options);
    // }

    // refreshToken(clientId, token, options = {}) {
    //   const request = new NetworkRequest({
    //     method: HttpMethod.POST,
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded'
    //     },
    //     authType: AuthType.App,
    //     url: url.format({
    //       protocol: this.client.protocol,
    //       host: this.client.host,
    //       pathname: tokenPathname
    //     }),
    //     properties: options.properties,
    //     data: {
    //       grant_type: 'refresh_token',
    //       client_id: clientId,
    //       redirect_uri: token.redirect_uri,
    //       refresh_token: token.refresh_token
    //     }
    //   });
    //   request.automaticallyRefreshAuthToken = false;

    //   const promise = request.execute().then(response => {
    //     return response.data;
    //   });

    //   return promise;
    // }

  }], [{
    key: 'identity',
    get: function get() {
      return process.env.KINVEY_MIC_IDENTITY || 'kinveyAuth';
    }
  }]);

  return MobileIdentityConnect;
}();