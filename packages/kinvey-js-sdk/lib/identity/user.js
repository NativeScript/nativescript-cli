'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getActiveUser = exports.remove = exports.logout = exports.loginWithMIC = exports.login = exports.signup = undefined;

var signup = exports.signup = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(data) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var activeUser, _options$state, state, url, request, response, user;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            activeUser = (0, _http.getActiveUser)();
            _options$state = options.state, state = _options$state === undefined ? true : _options$state;

            if (!(state === true && activeUser)) {
              _context.next = 4;
              break;
            }

            throw new Error('An active user already exists. Please logout the active user before you signup.');

          case 4:
            url = (0, _http.formatKinveyBaasUrl)('/' + NAMESPACE + '/appKey');
            request = new _http.KinveyRequest({
              method: _http.RequestMethod.POST,
              auth: _http.Auth.App,
              url: url,
              body: (0, _isEmpty2.default)(data) ? null : data
            });
            _context.next = 8;
            return (0, _http.execute)(request);

          case 8:
            response = _context.sent;
            user = response.data;


            if (state === true) {
              (0, _http.setActiveUser)(user);
            }

            return _context.abrupt('return', user);

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function signup(_x2) {
    return _ref.apply(this, arguments);
  };
}();

var login = exports.login = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(username, password) {
    var activeUser, credentials, url, request, response, user;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            activeUser = (0, _http.getActiveUser)();
            credentials = username;

            if (!activeUser) {
              _context2.next = 4;
              break;
            }

            throw new Error('An active user already exists. Please logout the active user before you login.');

          case 4:

            if (!(0, _isPlainObject2.default)(credentials)) {
              credentials = { username: username, password: password };
            }

            if (!(credentials.username && !(0, _isString2.default)(credentials.username))) {
              _context2.next = 9;
              break;
            }

            throw new Error('Username must be a string.');

          case 9:
            credentials.username = credentials.username.trim();

          case 10:
            if (!(credentials.password && !(0, _isString2.default)(credentials.password))) {
              _context2.next = 14;
              break;
            }

            throw new Error('Password must be a string.');

          case 14:
            credentials.password = credentials.password.trim();

          case 15:
            if (!((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '') && !credentials._socialIdentity)) {
              _context2.next = 17;
              break;
            }

            throw new Error('Username and/or password missing. Please provide both a username and password to login.');

          case 17:
            url = (0, _http.formatKinveyBaasUrl)('/' + NAMESPACE + '/appKey/login');
            request = new _http.KinveyRequest({
              method: _http.RequestMethod.POST,
              auth: _http.Auth.App,
              url: url,
              body: credentials
            });
            _context2.next = 21;
            return (0, _http.execute)(request);

          case 21:
            response = _context2.sent;
            user = response.data;

            (0, _http.setActiveUser)(user);
            return _context2.abrupt('return', user);

          case 25:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function login(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var loginWithMIC = exports.loginWithMIC = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(redirectUri, authorizationGrant, options) {
    var activeUser, session, socialIdentity, credentials;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            activeUser = (0, _http.getActiveUser)();

            if (!activeUser) {
              _context3.next = 3;
              break;
            }

            throw new Error('An active user already exists. Please logout the active user before you login with Mobile Identity Connect.');

          case 3:
            _context3.next = 5;
            return MIC.login(redirectUri, authorizationGrant, options);

          case 5:
            session = _context3.sent;
            socialIdentity = { kinveyAuth: session };
            credentials = { _socialIdentity: socialIdentity };
            _context3.prev = 8;
            _context3.next = 11;
            return login(credentials);

          case 11:
            return _context3.abrupt('return', _context3.sent);

          case 14:
            _context3.prev = 14;
            _context3.t0 = _context3['catch'](8);

            if (!(_context3.t0.name === 'NotFoundError')) {
              _context3.next = 22;
              break;
            }

            _context3.next = 19;
            return signup(credentials);

          case 19:
            _context3.next = 21;
            return login(credentials);

          case 21:
            return _context3.abrupt('return', _context3.sent);

          case 22:
            throw _context3.t0;

          case 23:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[8, 14]]);
  }));

  return function loginWithMIC(_x5, _x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

var logout = exports.logout = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var activeUser, url, request;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            activeUser = (0, _http.getActiveUser)();

            // TODO: unregister from live service
            // TODO: clear data store cache

            if (!activeUser) {
              _context4.next = 11;
              break;
            }

            url = (0, _http.formatKinveyBaasUrl)('/' + NAMESPACE + '/appKey/_logout');
            request = new _http.KinveyRequest({
              method: _http.RequestMethod.POST,
              auth: _http.Auth.Session,
              url: url
            });
            _context4.prev = 4;
            _context4.next = 7;
            return (0, _http.execute)(request);

          case 7:
            _context4.next = 11;
            break;

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4['catch'](4);

          case 11:

            (0, _http.removeActiveUser)();
            return _context4.abrupt('return', true);

          case 13:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[4, 9]]);
  }));

  return function logout() {
    return _ref4.apply(this, arguments);
  };
}();

var remove = exports.remove = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(id) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _options$hard, hard, activeUser, url, request, response;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _options$hard = options.hard, hard = _options$hard === undefined ? false : _options$hard;
            activeUser = (0, _http.getActiveUser)();

            if ((0, _isString2.default)(id)) {
              _context5.next = 4;
              break;
            }

            throw new Error('id must be a string.');

          case 4:
            if (activeUser) {
              _context5.next = 6;
              break;
            }

            throw new Error('Please login to remove the user.');

          case 6:
            url = (0, _http.formatKinveyBaasUrl)('/user/appKey/' + id, { hard: hard });
            request = new _http.KinveyRequest({
              method: _http.RequestMethod.DELETE,
              auth: _http.Auth.Session,
              url: url
            });
            _context5.next = 10;
            return (0, _http.execute)(request);

          case 10:
            response = _context5.sent;

            (0, _http.removeActiveUser)();
            return _context5.abrupt('return', response.data);

          case 13:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function remove(_x9) {
    return _ref5.apply(this, arguments);
  };
}();

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _http = require('../http');

var _mic = require('./mic');

var MIC = _interopRequireWildcard(_mic);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var NAMESPACE = 'user';

exports.getActiveUser = _http.getActiveUser;