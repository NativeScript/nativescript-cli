'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NetworkRequest = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('./request');

var _errors = require('../../errors');

var _response = require('./response');

var _kinveyJavascriptRack = require('kinvey-javascript-rack');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// eslint-disable-line no-unused-vars

var NetworkRequest = exports.NetworkRequest = function (_Request) {
  _inherits(NetworkRequest, _Request);

  function NetworkRequest() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, NetworkRequest);

    var _this = _possibleConstructorReturn(this, (NetworkRequest.__proto__ || Object.getPrototypeOf(NetworkRequest)).call(this, options));

    _this.rack = NetworkRequest.rack;
    return _this;
  }

  _createClass(NetworkRequest, [{
    key: 'execute',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var response;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.rack) {
                  _context.next = 2;
                  break;
                }

                throw new _errors.KinveyError('Unable to execute the request. Please provide a rack to execute the request.');

              case 2:
                _context.next = 4;
                return this.rack.execute(this);

              case 4:
                response = _context.sent;

                this.executing = false;

                if (response) {
                  _context.next = 8;
                  break;
                }

                throw new _errors.NoResponseError();

              case 8:

                if (!(response instanceof _response.Response)) {
                  response = new _response.Response({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: response.data
                  });
                }

                return _context.abrupt('return', response);

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function execute() {
        return _ref.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: 'cancel',
    value: function cancel() {
      var _this2 = this;

      var promise = _get(NetworkRequest.prototype.__proto__ || Object.getPrototypeOf(NetworkRequest.prototype), 'cancel', this).call(this).then(function () {
        return _this2.rack.cancel();
      });
      return promise;
    }
  }], [{
    key: 'rack',
    get: function get() {
      return NetworkRequest._rack;
    },
    set: function set(rack) {
      if (!rack || !(rack instanceof _kinveyJavascriptRack.Rack)) {
        throw new _errors.KinveyError('Unable to set the rack of a NetworkRequest. It must be an instance of a Rack');
      }

      NetworkRequest._rack = rack;
    }
  }]);

  return NetworkRequest;
}(_request.Request);