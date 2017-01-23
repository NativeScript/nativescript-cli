'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('../../request');

var _errors = require('../../errors');

var _utils = require('../../utils');

var _query = require('../../query');

var _query2 = _interopRequireDefault(_query);

var _networkstore = require('./networkstore');

var _networkstore2 = _interopRequireDefault(_networkstore);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var usersNamespace = process && process.env && process.env.KINVEY_USERS_NAMESPACE || 'user' || 'user';
var rpcNamespace = process && process.env && process.env.KINVEY_RPC_NAMESPACE || 'rpc' || 'rpc';

var UserStore = function (_NetworkStore) {
  _inherits(UserStore, _NetworkStore);

  function UserStore(options) {
    _classCallCheck(this, UserStore);

    return _possibleConstructorReturn(this, (UserStore.__proto__ || Object.getPrototypeOf(UserStore)).call(this, null, options));
  }

  _createClass(UserStore, [{
    key: 'lookup',
    value: function lookup(query) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        if ((0, _utils.isDefined)(query) && !(query instanceof _query2.default)) {
          return observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.'));
        }

        var request = new _request.KinveyRequest({
          method: _request.RequestMethod.POST,
          authType: _request.AuthType.Default,
          url: _url2.default.format({
            protocol: _this2.client.protocol,
            host: _this2.client.host,
            pathname: _this2.pathname + '/_lookup',
            query: options.query
          }),
          properties: options.properties,
          body: (0, _utils.isDefined)(query) ? query.toPlainObject().filter : null,
          timeout: options.timeout,
          client: _this2.client
        });

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (data) {
          return observer.next(data);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });
      return stream;
    }
  }, {
    key: 'create',
    value: function create() {
      return _es6Promise2.default.reject(new _errors.KinveyError('Please use `User.signup()` to create a user.'));
    }
  }, {
    key: 'update',
    value: function update(data) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!data) {
        return _es6Promise2.default.reject(new _errors.KinveyError('No user was provided to be updated.'));
      }

      if ((0, _isArray2.default)(data)) {
        return _es6Promise2.default.reject(new _errors.KinveyError('Only one user can be updated at one time.', data));
      }

      if (!data._id) {
        return _es6Promise2.default.reject(new _errors.KinveyError('User must have an _id.'));
      }

      return _get(UserStore.prototype.__proto__ || Object.getPrototypeOf(UserStore.prototype), 'update', this).call(this, data, options);
    }
  }, {
    key: 'exists',
    value: function exists(username) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var request = new _request.KinveyRequest({
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
      return request.execute().then(function (response) {
        return response.data;
      }).then(function () {
        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return data.usernameExists === true;
      });
    }
  }, {
    key: 'restore',
    value: function restore(id) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var request = new _request.KinveyRequest({
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
      return request.execute().then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appKey;
    }
  }]);

  return UserStore;
}(_networkstore2.default);

exports.default = new UserStore();