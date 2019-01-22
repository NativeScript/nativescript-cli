"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _acl = _interopRequireDefault(require("../acl"));

var _kmd = _interopRequireDefault(require("../kmd"));

var _session = require("../session");

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _config = require("../kinvey/config");

var _device = require("../kinvey/device");

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _datastore = require("../datastore");

var _utils2 = require("./utils");

var USER_NAMESPACE = 'user';

var User =
/*#__PURE__*/
function () {
  function User() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2.default)(this, User);
    this.data = data;
  }

  (0, _createClass2.default)(User, [{
    key: "isActive",
    value: function isActive() {
      var activeUser = (0, _session.get)();

      if (activeUser && activeUser._id === this._id) {
        return true;
      }

      return false;
    }
  }, {
    key: "isEmailVerified",
    value: function isEmailVerified() {
      var metadata = this.metadata;

      if (metadata) {
        var status = metadata.emailVerification;
        return status === 'confirmed';
      }

      return false;
    }
  }, {
    key: "me",
    value: function () {
      var _me = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee() {
        var options,
            _getConfig,
            apiProtocol,
            apiHost,
            appKey,
            request,
            response,
            data,
            _args = arguments;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = _args.length > 0 && _args[0] !== undefined ? _args[0] : {};
                _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.GET,
                  auth: _auth.Auth.Session,
                  url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(USER_NAMESPACE, "/").concat(appKey, "/_me")),
                  timeout: options.timeout
                });
                _context.next = 5;
                return request.execute();

              case 5:
                response = _context.sent;
                data = response.data; // Remove sensitive data

                delete data.password; // Merge _socialIdentity

                if (data._socialIdentity) {
                  data._socialIdentity = (0, _utils2.mergeSocialIdentity)(this._socialIdentity, data._socialIdentity);
                } // Update the active session


                if (this.isActive()) {
                  (0, _session.set)(data);
                }

                this.data = data;
                return _context.abrupt("return", this);

              case 12:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function me() {
        return _me.apply(this, arguments);
      }

      return me;
    }()
  }, {
    key: "update",
    value: function () {
      var _update = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(data) {
        var options,
            _getConfig2,
            apiProtocol,
            apiHost,
            appKey,
            body,
            request,
            response,
            updatedData,
            _args2 = arguments;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                options = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : {};
                _getConfig2 = (0, _config.get)(), apiProtocol = _getConfig2.apiProtocol, apiHost = _getConfig2.apiHost, appKey = _getConfig2.appKey;
                body = Object.assign({}, this.data, data);

                if (data) {
                  _context2.next = 5;
                  break;
                }

                throw new _kinvey.default('No user was provided to be updated.');

              case 5:
                if (!(0, _isArray.default)(data)) {
                  _context2.next = 7;
                  break;
                }

                throw new _kinvey.default('Only one user can be updated at one time.');

              case 7:
                if (body._id) {
                  _context2.next = 9;
                  break;
                }

                throw new _kinvey.default('User must have an _id.');

              case 9:
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.PUT,
                  auth: _auth.Auth.Default,
                  url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(USER_NAMESPACE, "/").concat(appKey, "/").concat(this._id)),
                  body: body,
                  timeout: options.timeout
                });
                _context2.next = 12;
                return request.execute();

              case 12:
                response = _context2.sent;
                updatedData = response.data; // Remove sensitive data

                delete updatedData.password; // Merge _socialIdentity

                if (updatedData._socialIdentity) {
                  updatedData._socialIdentity = (0, _utils2.mergeSocialIdentity)(this._socialIdentity, updatedData._socialIdentity);
                } // Update the active session


                if (this.isActive()) {
                  (0, _session.set)(updatedData);
                }

                this.data = updatedData;
                return _context2.abrupt("return", this);

              case 19:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function update(_x) {
        return _update.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: "registerForLiveService",
    value: function () {
      var _registerForLiveService = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3() {
        var _getConfig3, apiProtocol, apiHost, appKey, deviceId, request, response, config;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (Live.isRegistered()) {
                  _context3.next = 9;
                  break;
                }

                _getConfig3 = (0, _config.get)(), apiProtocol = _getConfig3.apiProtocol, apiHost = _getConfig3.apiHost, appKey = _getConfig3.appKey;
                deviceId = (0, _device.getId)();
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  auth: _auth.Auth.Session,
                  url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(USER_NAMESPACE, "/").concat(appKey, "/").concat(this._id, "/register-realtime")),
                  body: {
                    deviceId: deviceId
                  }
                });
                _context3.next = 6;
                return request.execute();

              case 6:
                response = _context3.sent;
                config = Object.assign({}, {
                  ssl: true,
                  authKey: this.authtoken
                }, response.data);
                Live.register(config);

              case 9:
                return _context3.abrupt("return", true);

              case 10:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function registerForLiveService() {
        return _registerForLiveService.apply(this, arguments);
      }

      return registerForLiveService;
    }()
  }, {
    key: "unregisterFromLiveService",
    value: function () {
      var _unregisterFromLiveService = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4() {
        var _getConfig4, apiProtocol, apiHost, appKey, deviceId, request;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!Live.isRegistered()) {
                  _context4.next = 7;
                  break;
                }

                _getConfig4 = (0, _config.get)(), apiProtocol = _getConfig4.apiProtocol, apiHost = _getConfig4.apiHost, appKey = _getConfig4.appKey;
                deviceId = (0, _device.getId)();
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  auth: _auth.Auth.Session,
                  url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(USER_NAMESPACE, "/").concat(appKey, "/").concat(this._id, "/unregister-realtime")),
                  body: {
                    deviceId: deviceId
                  }
                });
                _context4.next = 6;
                return request.execute();

              case 6:
                Live.unregister();

              case 7:
                return _context4.abrupt("return", true);

              case 8:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function unregisterFromLiveService() {
        return _unregisterFromLiveService.apply(this, arguments);
      }

      return unregisterFromLiveService;
    }()
  }, {
    key: "logout",
    value: function () {
      var _logout = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5() {
        var options,
            _getConfig5,
            apiProtocol,
            apiHost,
            appKey,
            url,
            request,
            _args5 = arguments;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                options = _args5.length > 0 && _args5[0] !== undefined ? _args5[0] : {};
                _getConfig5 = (0, _config.get)(), apiProtocol = _getConfig5.apiProtocol, apiHost = _getConfig5.apiHost, appKey = _getConfig5.appKey;

                if (!this.isActive()) {
                  _context5.next = 15;
                  break;
                }

                _context5.prev = 3;
                // TODO: unregister from live service and push
                url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(USER_NAMESPACE, "/").concat(appKey, "/_logout"));
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  auth: _auth.Auth.Session,
                  url: url,
                  timeout: options.timeout
                });
                _context5.next = 8;
                return request.execute();

              case 8:
                _context5.next = 12;
                break;

              case 10:
                _context5.prev = 10;
                _context5.t0 = _context5["catch"](3);

              case 12:
                (0, _session.remove)();
                _context5.next = 15;
                return (0, _datastore.clear)();

              case 15:
                return _context5.abrupt("return", this);

              case 16:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[3, 10]]);
      }));

      function logout() {
        return _logout.apply(this, arguments);
      }

      return logout;
    }()
  }, {
    key: "_id",
    get: function get() {
      if (this.data) {
        return this.data._id;
      }

      return undefined;
    }
  }, {
    key: "_acl",
    get: function get() {
      if (this.data) {
        return new _acl.default(this.data);
      }

      return undefined;
    }
  }, {
    key: "_kmd",
    get: function get() {
      if (this.data) {
        return new _kmd.default(this.data);
      }

      return undefined;
    }
  }, {
    key: "metadata",
    get: function get() {
      return this._kmd;
    }
  }, {
    key: "authtoken",
    get: function get() {
      var kmd = this._kmd;

      if (kmd) {
        return kmd.authtoken;
      }

      return undefined;
    }
  }, {
    key: "_socialIdentity",
    get: function get() {
      return this.data._socialIdentity;
    }
  }, {
    key: "username",
    get: function get() {
      if (this.data) {
        return this.data.username;
      }

      return undefined;
    }
  }, {
    key: "email",
    get: function get() {
      if (this.data) {
        return this.data.email;
      }

      return undefined;
    }
  }]);
  return User;
}();

exports.default = User;