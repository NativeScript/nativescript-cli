'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UserStore = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _errors = require('../errors');

var _networkstore = require('./networkstore');

var _enums = require('../enums');

var _network = require('../requests/network');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var usersNamespace = 'user' || 'user';
var rpcNamespace = 'rpc' || 'rpc';
var idAttribute = '_id' || '_id';
var socialIdentityAttribute = '_socialIdentity' || '_socialIdentity';

var UserStore = exports.UserStore = function (_NetworkStore) {
  _inherits(UserStore, _NetworkStore);

  function UserStore() {
    _classCallCheck(this, UserStore);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(UserStore).apply(this, arguments));
  }

  _createClass(UserStore, [{
    key: 'save',
    value: function save(user) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = _babybird2.default.resolve().then(function () {
        if (!user) {
          throw new _errors.KinveyError('No user was provided to be updated.');
        }

        if ((0, _isArray2.default)(user)) {
          throw new _errors.KinveyError('Please only update one user at a time.', user);
        }

        if (!user[idAttribute]) {
          throw new _errors.KinveyError('User must have an _id.');
        }

        if (options._identity) {
          var socialIdentity = user[socialIdentityAttribute];
          if (socialIdentity) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = socialIdentity[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _step$value = _slicedToArray(_step.value, 1);

                var key = _step$value[0];

                if (socialIdentity[key] && options._identity !== key) {
                  delete socialIdentity[key];
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          }
        }

        return _get(Object.getPrototypeOf(UserStore.prototype), 'save', _this2).call(_this2, user, options);
      });

      return promise;
    }
  }, {
    key: 'exists',
    value: function exists(username, options) {
      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.App,
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

      var promise = request.execute().then(function (response) {
        return response.data.usernameExists;
      });
      return promise;
    }
  }, {
    key: 'restore',
    value: function restore(id) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.Master,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname + '/id'
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });

      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
    }
  }, {
    key: '_pathname',

    /**
     * The pathname for the store.
     *
     * @return  {string}   Pathname
     */
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appKey;
    }
  }]);

  return UserStore;
}(_networkstore.NetworkStore);