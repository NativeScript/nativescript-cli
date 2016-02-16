'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _LocalRequest = require('../requests/LocalRequest');

var _LocalRequest2 = _interopRequireDefault(_LocalRequest);

var _client = require('../client');

var _client2 = _interopRequireDefault(_client);

var _enums = require('../enums');

var _errors = require('../errors');

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var activeUserSymbol = Symbol();
var localNamespace = process.env.KINVEY_LOCAL_NAMESPACE || 'local';
var activeUserCollection = process.env.KINVEY_ACTIVE_USER_COLLECTION || 'activeUser';

/**
 * @private
 */

var UserUtils = function () {
  function UserUtils() {
    _classCallCheck(this, UserUtils);
  }

  _createClass(UserUtils, null, [{
    key: 'getActive',
    value: function getActive() {
      var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];

      var user = UserUtils[activeUserSymbol][client.appKey];

      if (user) {
        return Promise.resolve(user);
      }

      var request = new _LocalRequest2.default({
        method: _enums.HttpMethod.GET,
        url: client.getUrl('/' + localNamespace + '/' + client.appKey + '/' + activeUserCollection)
      });
      var promise = request.execute().then(function (response) {
        var data = response.data;

        if (data.length === 0) {
          return null;
        }

        user = data[0];
        UserUtils[activeUserSymbol][client.appKey] = user;
        return user;
      }).catch(function (err) {
        if (err instanceof _errors.NotFoundError) {
          return null;
        }

        throw err;
      });

      return promise;
    }
  }, {
    key: 'setActive',
    value: function setActive(user) {
      var client = arguments.length <= 1 || arguments[1] === undefined ? _client2.default.sharedInstance() : arguments[1];

      var promise = UserUtils.getActive(client).then(function (activeUser) {
        if (activeUser) {
          var request = new _LocalRequest2.default({
            method: _enums.HttpMethod.DELETE,
            url: client.getUrl('/' + localNamespace + '/' + client.appKey + '/' + activeUserCollection + '/' + activeUser._id)
          });
          return request.execute().then(function () {
            UserUtils[activeUserSymbol][client.appKey] = null;
          });
        }
      }).then(function () {
        if (user) {
          var request = new _LocalRequest2.default({
            method: _enums.HttpMethod.POST,
            url: client.getUrl('/' + localNamespace + '/' + client.appKey + '/' + activeUserCollection),
            data: (0, _result2.default)(user, 'toJSON', user)
          });
          return request.execute();
        }
      }).then(function (response) {
        if (response && response.isSuccess()) {
          user = response.data;
          UserUtils[activeUserSymbol][client.appKey] = user;
          return user;
        }
      });

      return promise;
    }
  }]);

  return UserUtils;
}();

exports.default = UserUtils;


UserUtils[activeUserSymbol] = {};