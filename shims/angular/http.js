'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AngularHttpMiddleware = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _middleware = require('../../core/rack/middleware');

var _enums = require('../../core/enums');

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 */

var AngularHttpMiddleware = exports.AngularHttpMiddleware = function (_KinveyMiddleware) {
  _inherits(AngularHttpMiddleware, _KinveyMiddleware);

  function AngularHttpMiddleware($http) {
    _classCallCheck(this, AngularHttpMiddleware);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AngularHttpMiddleware).call(this, 'Kinvey Angular Http Middleware'));

    _this.$http = $http;
    return _this;
  }

  _createClass(AngularHttpMiddleware, [{
    key: 'handle',
    value: function handle(request) {
      var _this2 = this;

      return _get(Object.getPrototypeOf(AngularHttpMiddleware.prototype), 'handle', this).call(this, request).then(function () {
        var options = {
          url: request.url,
          method: request.method,
          headers: request.headers,
          params: request.flags || {}
        };

        if (request.query) {
          var query = (0, _result2.default)(request.query, 'toJSON', request.query);
          options.params.query = query.filter;

          if (!(0, _isEmpty2.default)(query.fields)) {
            options.params.fields = query.fields.join(',');
          }

          if (query.limit) {
            options.params.limit = query.limit;
          }

          if (query.skip > 0) {
            options.params.skip = query.skip;
          }

          if (!(0, _isEmpty2.default)(query.sort)) {
            options.params.sort = query.sort;
          }
        }

        for (var key in options.params) {
          if (options.params.hasOwnProperty(key)) {
            options.params[key] = (0, _isString2.default)(options.params[key]) ? options.params[key] : JSON.stringify(options.params[key]);
          }
        }

        if (request.data && (request.method === _enums.HttpMethod.PATCH || request.method === _enums.HttpMethod.POST || request.method === _enums.HttpMethod.PUT)) {
          options.data = request.data;
        }

        return _this2.$http(options).then(function (response) {
          request.response = {
            statusCode: response.status,
            headers: response.headers(),
            data: response.data
          };

          return request;
        }).catch(function (response) {
          request.response = {
            statusCode: response.status,
            headers: response.headers(),
            data: response.data
          };

          return request;
        });
      });
    }
  }]);

  return AngularHttpMiddleware;
}(_middleware.KinveyMiddleware);