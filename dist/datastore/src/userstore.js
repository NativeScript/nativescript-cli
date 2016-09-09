'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UserStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('../../request');

var _errors = require('../../errors');

var _networkstore = require('./networkstore');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


var usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
var rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The UserStore class is used to find, save, update, remove, count and group users.
 */

var UserStore = exports.UserStore = function (_NetworkStore) {
  _inherits(UserStore, _NetworkStore);

  function UserStore(options) {
    _classCallCheck(this, UserStore);

    return _possibleConstructorReturn(this, (UserStore.__proto__ || Object.getPrototypeOf(UserStore)).call(this, null, options));
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */


  _createClass(UserStore, [{
    key: 'create',


    /**
     * @private
     * @throws {KinveyError} Method is unsupported. Instead use User.signup() to create a user.
     */
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                throw new _errors.KinveyError('Please use `User.signup()` to create a user.');

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function create() {
        return _ref.apply(this, arguments);
      }

      return create;
    }()

    /**
     * Update a user.
     *
     * @deprecated Use the `update` function for a user instance.
     *
     * @param {Object} data Data for user to update.
     * @param {Object} [options={}] Options
     * @return {Promise<Object>} The updated user data.
     */

  }, {
    key: 'update',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2(data) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (data) {
                  _context2.next = 2;
                  break;
                }

                throw new _errors.KinveyError('No user was provided to be updated.');

              case 2:
                if (!(0, _isArray2.default)(data)) {
                  _context2.next = 4;
                  break;
                }

                throw new _errors.KinveyError('Only one user can be updated at one time.', data);

              case 4:
                if (data[idAttribute]) {
                  _context2.next = 6;
                  break;
                }

                throw new _errors.KinveyError('User must have an _id.');

              case 6:
                return _context2.abrupt('return', _get(UserStore.prototype.__proto__ || Object.getPrototypeOf(UserStore.prototype), 'update', this).call(this, data, options));

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function update(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return update;
    }()

    /**
     * Check if a username already exists.
     *
     * @deprecated Use the `exists` function on the `User` class.
     *
     * @param {string} username Username
     * @param {Object} [options={}] Options
     * @return {boolean} True if the username already exists otherwise false.
     */

  }, {
    key: 'exists',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(username) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, response, data;
        return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/check-username-exists'
                  }),
                  properties: options.properties,
                  data: { username: username },
                  timeout: options.timeout,
                  client: this.client
                });
                _context3.next = 3;
                return request.execute();

              case 3:
                response = _context3.sent;
                data = response.data || {};
                return _context3.abrupt('return', data.usernameExists === true);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function exists(_x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return exists;
    }()

    /**
     * Restore a user that has been suspended.
     *
     * @deprecated Use the `restore` function on the `User` class.
     *
     * @param {string} id Id of the user to restore.
     * @param {Object} [options={}] Options
     * @return {Promise<Object>} The response.
     */

  }, {
    key: 'restore',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee4(id) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, response;
        return _regeneratorRuntime2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.Master,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + id
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                _context4.next = 3;
                return request.execute();

              case 3:
                response = _context4.sent;
                return _context4.abrupt('return', response.data);

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function restore(_x7, _x8) {
        return _ref4.apply(this, arguments);
      }

      return restore;
    }()
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appKey;
    }
  }]);

  return UserStore;
}(_networkstore.NetworkStore);