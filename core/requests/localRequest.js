'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _response = require('./response');

var _response2 = _interopRequireDefault(_response);

var _cacheRack = require('../rack/racks/cacheRack');

var _errors = require('../errors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 */

var LocalRequest = function (_Request) {
  _inherits(LocalRequest, _Request);

  function LocalRequest() {
    _classCallCheck(this, LocalRequest);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(LocalRequest).apply(this, arguments));
  }

  _createClass(LocalRequest, [{
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      var promise = _get(Object.getPrototypeOf(LocalRequest.prototype), 'execute', this).call(this).then(function () {
        var rack = _cacheRack.CacheRack.sharedInstance();
        return rack.execute(_this2.toJSON());
      }).then(function (response) {
        if (!response) {
          throw new _errors.NoResponseError();
        }

        return new _response2.default({
          statusCode: response.statusCode,
          headers: response.headers,
          data: response.data
        });
      }).then(function (response) {
        if (!response.isSuccess()) {
          throw response.error;
        }

        return response;
      });

      return promise;
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      var rack = _cacheRack.CacheRack.sharedInstance();
      rack.cancel();
    }
  }]);

  return LocalRequest;
}(_request2.default);

exports.default = LocalRequest;