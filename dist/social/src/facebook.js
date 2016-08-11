'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Facebook = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _social = require('./social');

var _enums = require('./enums');

var _es6Promise = require('es6-promise');

var _errors = require('../../errors');

var _string = require('../../utils/string');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _es6Promise.Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _es6Promise.Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-disable camelcase */
// eslint-disable-line no-unused-vars


/**
 * @private
 */

var Facebook = exports.Facebook = function (_Social) {
  _inherits(Facebook, _Social);

  function Facebook() {
    _classCallCheck(this, Facebook);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Facebook).apply(this, arguments));
  }

  _createClass(Facebook, [{
    key: 'isSupported',
    value: function isSupported() {
      return !!global.KinveyPopup;
    }
  }, {
    key: 'login',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(clientId) {
        var _this2 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var session, promise;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = (0, _assign2.default)({
                  force: false,
                  scope: 'public_profile'
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
                promise = new _es6Promise.Promise(function (resolve, reject) {
                  var redirectUri = options.redirectUri || global.location.href;
                  var originalState = (0, _string.randomString)();
                  var popup = new global.KinveyPopup();
                  var redirected = false;

                  // Handle the response from a login request
                  var oauthCallback = function oauthCallback(urlString) {
                    var _url$parse = _url2.default.parse(urlString);

                    var hash = _url$parse.hash;

                    var _querystring$parse = _querystring2.default.parse(hash.substring(1));

                    var access_token = _querystring$parse.access_token;
                    var expires_in = _querystring$parse.expires_in;
                    var error = _querystring$parse.error;
                    var error_description = _querystring$parse.error_description;
                    var error_reason = _querystring$parse.error_reason;
                    var state = _querystring$parse.state;

                    var expiresIn = parseInt(expires_in, 10);
                    var expires = new Date().getTime() / 1e3 + (expiresIn || 60 * 60 * 24 * 365);

                    if (state === originalState) {
                      if (access_token) {
                        var _session = {
                          access_token: access_token,
                          expires_in: expiresIn,
                          expires: expires,
                          client_id: clientId
                        };
                        _this2.session = _session;
                        resolve(_session);
                      } else if (error) {
                        _this2.session = null;
                        reject({ reason: error_reason, error: error, description: error_description });
                      } else {
                        _this2.session = null;
                        reject({ reason: 'not_authorized', error: 'access_denied', description: 'Your app is not authorized.' });
                      }
                    } else {
                      _this2.session = null;
                      reject({ reason: 'state_mismatch', error: 'access_denied', description: 'The state did not match.' });
                    }
                  };

                  function loadCallback(event) {
                    var urlString = event.url;

                    try {
                      if (urlString && urlString.indexOf(redirectUri) === 0 && redirected === false) {
                        redirected = true;
                        popup.removeAllListeners();
                        popup.close();
                        oauthCallback(urlString);
                      }
                    } catch (error) {
                      // Just catch the error
                    }
                  }

                  function errorCallback(event) {
                    var urlString = event.url;

                    try {
                      if (urlString && urlString.indexOf(redirectUri) === 0 && redirected === false) {
                        redirected = true;
                        popup.removeAllListeners();
                        popup.close();
                        oauthCallback(urlString);
                      } else if (redirected === false) {
                        popup.removeAllListeners();
                        popup.close();
                        reject(new _errors.KinveyError(event.message, '', event.code));
                      }
                    } catch (error) {
                      // Just catch the error
                    }
                  }

                  function closedCallback() {
                    if (redirected === false) {
                      popup.removeAllListeners();
                      reject(new _errors.KinveyError('Facebook login has been cancelled.'));
                    }
                  }

                  popup.on('loadstart', loadCallback);
                  popup.on('loadstop', loadCallback);
                  popup.on('error', errorCallback);
                  popup.on('closed', closedCallback);
                  popup.open(_url2.default.format({
                    protocol: 'https:',
                    host: 'www.facebook.com',
                    pathname: '/dialog/oauth',
                    query: {
                      client_id: clientId,
                      redirect_uri: redirectUri,
                      response_type: 'token',
                      scope: options.scope,
                      auth_type: options.force === true ? 'rerequest' : null,
                      state: originalState
                    }
                  }));
                });
                return _context.abrupt('return', promise);

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function login(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return login;
    }()
  }, {
    key: 'logout',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2() {
        return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.session = null;

              case 1:
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
      return _enums.SocialIdentity.Facebook;
    }
  }], [{
    key: 'identity',
    get: function get() {
      return _enums.SocialIdentity.Facebook;
    }
  }]);

  return Facebook;
}(_social.Social);