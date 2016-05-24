'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NetworkRequest = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('./request');

var _rack = require('../rack/rack');

var _errors = require('../errors');

var _response2 = require('./response');

var _storage = require('../utils/storage');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var response, activeSocialIdentity, token, refreshTokenRequest, newToken, activeUser, socialIdentity, loginRequest, user, _response;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return _get(Object.getPrototypeOf(NetworkRequest.prototype), 'execute', this).call(this);

              case 3:
                _context.next = 5;
                return this.rack.execute(this);

              case 5:
                response = _context.sent;

                this.executing = false;

                if (response) {
                  _context.next = 9;
                  break;
                }

                throw new _errors.NoResponseError();

              case 9:

                if (!(response instanceof _response2.KinveyResponse)) {
                  response = new _response2.KinveyResponse(new _response2.KinveyResponseConfig({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: response.data
                  }));
                }

                if (response.isSuccess()) {
                  _context.next = 12;
                  break;
                }

                throw response.error;

              case 12:
                return _context.abrupt('return', response);

              case 15:
                _context.prev = 15;
                _context.t0 = _context['catch'](0);

                if (!(_context.t0 instanceof _errors.InvalidCredentialsError && this.automaticallyRefreshAuthToken)) {
                  _context.next = 50;
                  break;
                }

                this.automaticallyRefreshAuthToken = false;
                activeSocialIdentity = this.client.activeSocialIdentity;

                // Refresh MIC Auth Token

                if (!(activeSocialIdentity && activeSocialIdentity.identity === micIdentity)) {
                  _context.next = 50;
                  break;
                }

                // Refresh the token
                token = activeSocialIdentity.token;
                refreshTokenRequest = new NetworkRequest({
                  method: _request.RequestMethod.POST,
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: activeSocialIdentity.client.protocol,
                    host: activeSocialIdentity.client.host,
                    pathname: tokenPathname
                  }),
                  properties: this.properties,
                  data: {
                    grant_type: 'refresh_token',
                    client_id: token.audience,
                    redirect_uri: activeSocialIdentity.redirectUri,
                    refresh_token: token.refresh_token
                  }
                });

                refreshTokenRequest.automaticallyRefreshAuthToken = false;
                _context.next = 26;
                return refreshTokenRequest.execute().then(function (response) {
                  return response.data;
                });

              case 26:
                newToken = _context.sent;


                // Login the user with the new token
                activeUser = this.client.activeUser;
                socialIdentity = activeUser[socialIdentityAttribute];

                socialIdentity[activeSocialIdentity.identity] = newToken;
                activeUser[socialIdentityAttribute] = activeSocialIdentity;

                loginRequest = new NetworkRequest({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: '/' + usersNamespace + '/' + this.client.appKey + '/login'
                  }),
                  properties: this.properties,
                  data: activeUser,
                  timeout: this.timeout,
                  client: this.client
                });

                loginRequest.automaticallyRefreshAuthToken = false;
                _context.next = 35;
                return loginRequest.execute().then(function (response) {
                  return response.data;
                });

              case 35:
                user = _context.sent;


                // Store the new data
                (0, _storage.setActiveUser)(this.client, user);
                (0, _storage.setActiveSocialIdentity)(this.client, {
                  identity: activeSocialIdentity.identity,
                  redirectUri: activeSocialIdentity.redirectUri,
                  token: user[socialIdentityAttribute][activeSocialIdentity.identity],
                  client: activeSocialIdentity.client
                });

                _context.prev = 38;
                _context.next = 41;
                return this.execute();

              case 41:
                _response = _context.sent;

                this.automaticallyRefreshAuthToken = true;
                return _context.abrupt('return', _response);

              case 46:
                _context.prev = 46;
                _context.t1 = _context['catch'](38);

                this.automaticallyRefreshAuthToken = true;
                throw _context.t1;

              case 50:
                throw _context.t0;

              case 51:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 15], [38, 46]]);
      }));

      function execute() {
        return ref.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: 'cancel',
    value: function cancel() {
      var _this2 = this;

      var promise = _get(Object.getPrototypeOf(NetworkRequest.prototype), 'cancel', this).call(this).then(function () {
        return _this2.rack.cancel();
      });
      return promise;
    }
  }]);

  return NetworkRequest;
}(_request.KinveyRequest);