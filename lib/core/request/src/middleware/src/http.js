'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _utils = require('../../../../../common/utils');

var _package = require('../../../../../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function deviceInformation() {
  var platform = process.title;
  var version = process.version;
  var manufacturer = process.platform;

  var parts = ['js-' + _package2.default.name + '/' + _package2.default.version];

  return parts.concat([platform, version, manufacturer]).map(function (part) {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

var HttpMiddleware = function (_Middleware) {
  _inherits(HttpMiddleware, _Middleware);

  function HttpMiddleware() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Http Middleware';

    _classCallCheck(this, HttpMiddleware);

    return _possibleConstructorReturn(this, (HttpMiddleware.__proto__ || Object.getPrototypeOf(HttpMiddleware)).call(this, name));
  }

  _createClass(HttpMiddleware, [{
    key: 'handle',
    value: function handle(request) {
      var _this2 = this;

      var promise = new _es6Promise2.default(function (resolve, reject) {
        var url = request.url,
            method = request.method,
            headers = request.headers,
            body = request.body,
            timeout = request.timeout,
            followRedirect = request.followRedirect;

        headers['X-Kinvey-Device-Information'] = _this2.deviceInformation;

        (0, _request2.default)({
          method: method,
          url: url,
          headers: headers,
          body: body,
          followRedirect: followRedirect,
          timeout: timeout
        }, function (error, response, body) {
          if ((0, _utils.isDefined)(response) === false) {
            reject(error);
          } else {
            resolve({
              response: {
                statusCode: response.statusCode,
                headers: response.headers,
                data: body
              }
            });
          }
        });
      });
      return promise;
    }
  }, {
    key: 'cancel',
    value: function cancel() {

      return _es6Promise2.default.resolve();
    }
  }, {
    key: 'deviceInformation',
    get: function get() {
      return deviceInformation();
    }
  }]);

  return HttpMiddleware;
}(_middleware2.default);

exports.default = HttpMiddleware;