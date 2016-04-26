'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalRequest = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('./request');

var _rack = require('../rack/rack');

var _errors = require('../errors');

var _response = require('./response');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 */

var LocalRequest = exports.LocalRequest = function (_KinveyRequest) {
  _inherits(LocalRequest, _KinveyRequest);

  function LocalRequest(options) {
    _classCallCheck(this, LocalRequest);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(LocalRequest).call(this, options));

    _this.rack = _rack.CacheRack.sharedInstance();
    return _this;
  }

  _createClass(LocalRequest, [{
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      return _get(Object.getPrototypeOf(LocalRequest.prototype), 'execute', this).call(this).then(function () {
        return _this2.rack.execute(_this2);
      }).then(function (response) {
        // Throw a NoResponseError if we did not receive
        // a response
        if (!response) {
          throw new _errors.NoResponseError();
        }

        // Make sure the response is an instance of the
        // Response class
        if (!(response instanceof _response.Response)) {
          response = new _response.Response({
            statusCode: response.statusCode,
            headers: response.headers,
            data: response.data
          });
        }

        // Return the response
        return response;
      }).then(function (response) {
        // Flip the executing flag to false
        _this2.executing = false;

        // Throw the response error if we did not receive
        // a successfull response
        if (!response.isSuccess()) {
          throw response.error;
        }

        // Just return the response
        return response;
      });
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      var _this3 = this;

      return _get(Object.getPrototypeOf(LocalRequest.prototype), 'cancel', this).call(this).then(function () {
        return _this3.rack.cancel();
      });
    }
  }]);

  return LocalRequest;
}(_request.KinveyRequest);