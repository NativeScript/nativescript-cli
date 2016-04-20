'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NetworkRequest = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('./request');

var _rack = require('../rack/rack');

var _errors = require('../errors');

var _enums = require('../enums');

var _response = require('./response');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
var micIdentity = process.env.KINVEY_MIC_IDENTITY || 'kinveyAuth';
var tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
var usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';

/**
 * @private
 */

var NetworkRequest = exports.NetworkRequest = function (_KinveyRequest) {
  _inherits(NetworkRequest, _KinveyRequest);

  function NetworkRequest(options) {
    _classCallCheck(this, NetworkRequest);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(NetworkRequest).call(this, options));

    _this.rack = _rack.NetworkRack.sharedInstance();
    _this.automaticallyRefreshAuthToken = true;
    return _this;
  }

  _createClass(NetworkRequest, [{
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      var promise = _get(Object.getPrototypeOf(NetworkRequest.prototype), 'execute', this).call(this).then(function () {
        return _this2.rack.execute(_this2);
      }).then(function (response) {
        if (!response) {
          throw new _errors.NoResponseError();
        }

        if (!(response instanceof _response.Response)) {
          return new _response.Response({
            statusCode: response.statusCode,
            headers: response.headers,
            data: response.data
          });
        }

        return response;
      }).then(function (response) {
        if (!response.isSuccess()) {
          throw response.error;
        }

        return response;
      }).catch(function (error) {
        if (error instanceof _errors.InvalidCredentialsError && _this2.automaticallyRefreshAuthToken) {
          var _ret = function () {
            _this2.automaticallyRefreshAuthToken = false;
            var socialIdentity = _this2.client.socialIdentity;

            // Refresh MIC Auth Token
            if (socialIdentity && socialIdentity.identity === micIdentity) {
              // Refresh the token
              var token = socialIdentity.token;
              var request = new NetworkRequest({
                method: _enums.HttpMethod.POST,
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                authType: _enums.AuthType.App,
                url: _url2.default.format({
                  protocol: socialIdentity.client.protocol,
                  host: socialIdentity.client.host,
                  pathname: tokenPathname
                }),
                properties: _this2.properties,
                data: {
                  grant_type: 'refresh_token',
                  client_id: token.audience,
                  redirect_uri: socialIdentity.redirectUri,
                  refresh_token: token.refresh_token
                }
              });
              request.automaticallyRefreshAuthToken = false;

              return {
                v: request.execute().then(function (response) {
                  return response.data;
                }).then(function (token) {
                  // Login the user with the new token
                  var activeUser = _this2.client.user;
                  var socialIdentity = activeUser[socialIdentityAttribute];
                  socialIdentity[socialIdentity.identity] = token;
                  activeUser[socialIdentityAttribute] = socialIdentity;

                  var request = new NetworkRequest({
                    method: _enums.HttpMethod.POST,
                    authType: _enums.AuthType.App,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: '/' + usersNamespace + '/' + _this2.client.appKey + '/login'
                    }),
                    properties: _this2.properties,
                    data: activeUser,
                    timeout: _this2.timeout,
                    client: _this2.client
                  });
                  request.automaticallyRefreshAuthToken = false;
                  return request.execute();
                }).then(function (response) {
                  // Store the new data
                  _this2.client.user = response.data;
                  _this2.client.socialIdentity = {
                    identity: socialIdentity.identity,
                    redirectUri: socialIdentity.redirectUri,
                    token: response.data[socialIdentityAttribute][socialIdentity.identity],
                    client: socialIdentity.client
                  };

                  // Execute the original request
                  return _this2.execute();
                }).catch(function () {
                  throw error;
                })
              };
            }
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }

        throw error;
      }).then(function (response) {
        _this2.automaticallyRefreshAuthToken = true;
        return response;
      }).catch(function (error) {
        _this2.automaticallyRefreshAuthToken = true;
        throw error;
      });

      return promise;
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      var _this3 = this;

      var promise = _get(Object.getPrototypeOf(NetworkRequest.prototype), 'cancel', this).call(this).then(function () {
        return _this3.rack.cancel();
      });
      return promise;
    }
  }]);

  return NetworkRequest;
}(_request.KinveyRequest);