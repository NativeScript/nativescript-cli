'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
        var url = request.url;
        var method = request.method;
        var headers = request.headers;
        var body = request.body;
        var timeout = request.timeout;
        var followRedirect = request.followRedirect;

        var redirects = followRedirect === true ? 5 : 0;

        _this2.httpRequest = (0, _superagent2.default)(method, url).set(headers).send(body).timeout(timeout).redirects(redirects).end(function (error, response) {
          _this2.httpRequest = undefined;

          if (error) {
            response = error.response;
          }

          if (!response) {
            return reject(error);
          }

          return resolve({
            response: {
              statusCode: response.statusCode,
              headers: response.headers,
              data: response.body
            }
          });
        });
      });
      return promise;
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      if (typeof this.httpRequest !== 'undefined') {
        this.httpRequest.abort();
      }

      return _es6Promise2.default.resolve();
    }
  }]);

  return HttpMiddleware;
}(_middleware2.default);

exports.default = HttpMiddleware;