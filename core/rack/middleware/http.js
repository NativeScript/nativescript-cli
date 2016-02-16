'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HttpMiddleware = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _middleware = require('../middleware');

var _enums = require('../../enums');

var _errors = require('../../errors');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

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

var HttpMiddleware = exports.HttpMiddleware = function (_KinveyMiddleware) {
  _inherits(HttpMiddleware, _KinveyMiddleware);

  function HttpMiddleware() {
    _classCallCheck(this, HttpMiddleware);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(HttpMiddleware).call(this, 'Kinvey Http Middleware'));
  }

  _createClass(HttpMiddleware, [{
    key: 'handle',
    value: function handle(request) {
      return _get(Object.getPrototypeOf(HttpMiddleware.prototype), 'handle', this).call(this, request).then(function () {
        var options = {
          url: request.url,
          method: request.method,
          headers: request.headers,
          qs: {},
          followRedirect: request.followRedirect
        };

        if (request.query) {
          var query = (0, _result2.default)(request.query, 'toJSON', request.query);
          options.qs.query = query.filter;

          if (!(0, _isEmpty2.default)(query.fields)) {
            options.qs.fields = query.fields.join(',');
          }

          if (query.limit) {
            options.qs.limit = query.limit;
          }

          if (query.skip > 0) {
            options.qs.skip = query.skip;
          }

          if (!(0, _isEmpty2.default)(query.sort)) {
            options.qs.sort = query.sort;
          }
        }

        for (var key in options.qs) {
          if (options.qs.hasOwnProperty(key)) {
            options.qs[key] = (0, _isString2.default)(options.qs[key]) ? options.qs[key] : JSON.stringify(options.qs[key]);
          }
        }

        if (request.data && (request.method === _enums.HttpMethod.PATCH || request.method === _enums.HttpMethod.POST || request.method === _enums.HttpMethod.PUT)) {
          options.body = request.data;
        }

        return new Promise(function (resolve, reject) {
          (0, _request2.default)(options, function (err, response, body) {
            if (err) {
              if (err.code === 'ENOTFOUND') {
                return reject(new _errors.NetworkConnectionError('It looks like you do not have a network connection. ' + 'Please check that you are connected to a network and try again.'));
              }

              return reject(err);
            }

            request.response = {
              statusCode: response.statusCode,
              headers: response.headers,
              data: body
            };

            resolve(request);
          });
        });
      });
    }
  }]);

  return HttpMiddleware;
}(_middleware.KinveyMiddleware);