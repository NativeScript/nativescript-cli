'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyRackManager = exports.KinveyNetworkRack = exports.KinveyCacheRack = exports.KinveyRack = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _rack = require('kinvey-javascript-rack/dist/rack');

var _cache = require('./cache');

var _parse = require('./parse');

var _serialize = require('./serialize');

var _http = require('./http');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


/**
 * @private
 */
var KinveyRack = exports.KinveyRack = function (_Rack) {
  _inherits(KinveyRack, _Rack);

  function KinveyRack() {
    _classCallCheck(this, KinveyRack);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyRack).apply(this, arguments));
  }

  _createClass(KinveyRack, [{
    key: 'execute',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(request) {
        var _ref2, response;

        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _get(Object.getPrototypeOf(KinveyRack.prototype), 'execute', this).call(this, (0, _result2.default)(request, 'toPlainObject', request));

              case 2:
                _ref2 = _context.sent;
                response = _ref2.response;
                return _context.abrupt('return', response);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function execute(_x) {
        return _ref.apply(this, arguments);
      }

      return execute;
    }()
  }]);

  return KinveyRack;
}(_rack.Rack);

/**
 * @private
 */


var KinveyCacheRack = exports.KinveyCacheRack = function (_KinveyRack) {
  _inherits(KinveyCacheRack, _KinveyRack);

  function KinveyCacheRack() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Cache Rack' : arguments[0];

    _classCallCheck(this, KinveyCacheRack);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyCacheRack).call(this, name));

    _this2.use(new _cache.CacheMiddleware());
    return _this2;
  }

  return KinveyCacheRack;
}(KinveyRack);

/**
 * @private
 */


var KinveyNetworkRack = exports.KinveyNetworkRack = function (_KinveyRack2) {
  _inherits(KinveyNetworkRack, _KinveyRack2);

  function KinveyNetworkRack() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Network Rack' : arguments[0];

    _classCallCheck(this, KinveyNetworkRack);

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyNetworkRack).call(this, name));

    _this3.use(new _serialize.SerializeMiddleware());
    _this3.use(new _http.HttpMiddleware());
    _this3.use(new _parse.ParseMiddleware());
    return _this3;
  }

  return KinveyNetworkRack;
}(KinveyRack);

/**
 * @private
 */


var KinveyRackManager = function KinveyRackManager() {
  _classCallCheck(this, KinveyRackManager);

  this.cacheRack = new KinveyCacheRack();
  this.networkRack = new KinveyNetworkRack();
};

var kinveyRackManager = new KinveyRackManager();
exports.KinveyRackManager = kinveyRackManager;