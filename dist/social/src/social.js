'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Social = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable-line no-unused-vars


var _client = require('../../client');

var _errors = require('../../errors');

var _localStorage = require('local-storage');

var _localStorage2 = _interopRequireDefault(_localStorage);

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var hello = void 0;

if (typeof window !== 'undefined') {
  hello = require('hellojs'); // eslint-disable-line global-require
}

/**
 * @private
 */

var Social = exports.Social = function () {
  function Social() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Social);

    this.client = options.client || _client.Client.sharedInstance();
  }

  _createClass(Social, [{
    key: 'isSupported',
    value: function isSupported() {
      return !!hello;
    }
  }, {
    key: 'isOnline',
    value: function isOnline(session) {
      var currentTime = new Date().getTime() / 1000;
      return session && session.access_token && session.expires > currentTime;
    }
  }, {
    key: 'login',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(clientId) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var session, helloSettings;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = (0, _assign2.default)({
                  redirectUri: global.location.href,
                  scope: null,
                  force: null
                }, options);

                if (this.isSupported()) {
                  _context.next = 3;
                  break;
                }

                throw new _errors.KinveyError('Unable to login with ' + this.identity + '. It is not supported on this platform.');

              case 3:
                session = this.session;

                if (!(session && this.isOnline(session))) {
                  _context.next = 6;
                  break;
                }

                return _context.abrupt('return', session);

              case 6:
                if (clientId) {
                  _context.next = 8;
                  break;
                }

                throw new _errors.KinveyError('Unable to login with ' + this.identity + '. ' + ' No client id was provided.');

              case 8:
                helloSettings = {};

                helloSettings[this.identity] = clientId;
                hello.init(helloSettings);
                _context.next = 13;
                return hello(this.identity).login({
                  redirect_uri: options.redirectUri,
                  scope: options.scope,
                  force: options.force
                });

              case 13:
                session = hello(this.identity).getAuthResponse();
                session.clientId = clientId;
                this.session = session;
                return _context.abrupt('return', session);

              case 17:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function login(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return login;
    }()
  }, {
    key: 'logout',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2() {
        var helloSettings;
        return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this.isSupported()) {
                  _context2.next = 6;
                  break;
                }

                helloSettings = {};

                helloSettings[this.identity] = this.session.clientId;
                hello.init(helloSettings);
                _context2.next = 6;
                return hello(this.identity).logout();

              case 6:

                this.session = null;

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function logout() {
        return _ref2.apply(this, arguments);
      }

      return logout;
    }()
  }, {
    key: 'identity',
    get: function get() {
      throw new _errors.KinveyError('A subclass must override this property.');
    }
  }, {
    key: 'session',
    get: function get() {
      return _localStorage2.default.get('' + this.client.appKey + this.identity);
    },
    set: function set(session) {
      if (session) {
        _localStorage2.default.set('' + this.client.appKey + this.identity, session);
      } else {
        _localStorage2.default.remove('' + this.client.appKey + this.identity);
      }
    }
  }], [{
    key: 'login',
    value: function login(clientId, options) {
      var social = new this(options);
      return social.login(clientId, options);
    }
  }, {
    key: 'logout',
    value: function logout(user, options) {
      var social = new this();
      return social.logout(user, options);
    }
  }, {
    key: 'identity',
    get: function get() {
      throw new _errors.KinveyError('A subclass must override this property.');
    }
  }]);

  return Social;
}();