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

var _response = require('./response');

var _enums = require('../social/src/enums');

var _storage = require('../utils/storage');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


var socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
var tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
var usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';

/**
 * @private
 */

var NetworkRequest = exports.NetworkRequest = function (_KinveyRequest) {
  _inherits(NetworkRequest, _KinveyRequest);

  function NetworkRequest() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, NetworkRequest);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(NetworkRequest).call(this, options));

    _this.rack = _rack.KinveyRackManager.networkRack;
    return _this;
  }

  _createClass(NetworkRequest, [{
    key: 'execute',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var rawResponse = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
        var response, micSession, refreshMICRequestConfig, refreshMICRequest, newMicSession, data, loginRequestConfig, loginRequest, activeUser;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
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

                if (!(response instanceof _response.KinveyResponse)) {
                  response = new _response.KinveyResponse(new _response.KinveyResponseConfig({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: response.data
                  }));
                }

                if (!(rawResponse === false && response.isSuccess() === false)) {
                  _context.next = 12;
                  break;
                }

                throw response.error;

              case 12:
                return _context.abrupt('return', response);

              case 15:
                _context.prev = 15;
                _context.t0 = _context['catch'](0);

                if (!(_context.t0 instanceof _errors.InvalidCredentialsError)) {
                  _context.next = 38;
                  break;
                }

                // Retrieve the MIC session
                micSession = (0, _storage.getIdentitySession)(this.client, _enums.SocialIdentity.MobileIdentityConnect);

                if (!micSession) {
                  _context.next = 38;
                  break;
                }

                // Refresh MIC Auth Token
                refreshMICRequestConfig = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: micSession.protocol || this.client.micProtocol,
                    host: micSession.host || this.client.micHost,
                    pathname: tokenPathname
                  }),
                  body: {
                    grant_type: 'refresh_token',
                    client_id: micSession.client_id,
                    redirect_uri: micSession.redirect_uri,
                    refresh_token: micSession.refresh_token
                  },
                  timeout: this.timeout,
                  properties: this.properties
                });
                refreshMICRequest = new NetworkRequest(refreshMICRequestConfig);
                _context.next = 24;
                return refreshMICRequest.execute().then(function (response) {
                  return response.data;
                });

              case 24:
                newMicSession = _context.sent;

                micSession = (0, _assign2.default)(micSession, newMicSession);

                // Login the user with the new mic session
                data = {};

                data[socialIdentityAttribute] = {};
                data[socialIdentityAttribute][_enums.SocialIdentity.MobileIdentityConnect] = micSession;

                // Login the user
                loginRequestConfig = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: '/' + usersNamespace + '/' + this.client.appKey + '/login'
                  }),
                  properties: this.properties,
                  body: data,
                  timeout: this.timeout,
                  client: this.client
                });
                loginRequest = new NetworkRequest(loginRequestConfig);

                loginRequest.automaticallyRefreshAuthToken = false;
                _context.next = 34;
                return loginRequest.execute().then(function (response) {
                  return response.data;
                });

              case 34:
                activeUser = _context.sent;


                // Store the updated active user
                (0, _storage.setActiveUser)(this.client, activeUser);

                // Store the updated mic session
                (0, _storage.setIdentitySession)(this.client, _enums.SocialIdentity.MobileIdentityConnect, micSession);

                // Execute the original request
                return _context.abrupt('return', this.execute());

              case 38:
                throw _context.t0;

              case 39:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 15]]);
      }));

      function execute(_x2) {
        return _ref.apply(this, arguments);
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