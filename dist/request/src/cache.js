'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheRequest = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('./request');

var _rack = require('../../rack');

var _errors = require('../../errors');

var _response = require('./response');

var _urlPattern = require('url-pattern');

var _urlPattern2 = _interopRequireDefault(_urlPattern);

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


/**
 * @private
 */
var CacheRequest = exports.CacheRequest = function (_Request) {
  _inherits(CacheRequest, _Request);

  function CacheRequest(options) {
    _classCallCheck(this, CacheRequest);

    // Set default options
    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheRequest).call(this, options));

    options = (0, _assign2.default)({
      query: null
    }, options);

    _this.query = options.query;
    _this.rack = _rack.KinveyRackManager.cacheRack;
    return _this;
  }

  _createClass(CacheRequest, [{
    key: 'execute',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var response;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _get(Object.getPrototypeOf(CacheRequest.prototype), 'execute', this).call(this);

              case 2:
                _context.next = 4;
                return this.rack.execute(this);

              case 4:
                response = _context.sent;


                // Flip the executing flag to false
                this.executing = false;

                // Throw a NoResponseError if we did not receive
                // a response

                if (response) {
                  _context.next = 8;
                  break;
                }

                throw new _errors.NoResponseError();

              case 8:

                // Make sure the response is an instance of the
                // Response class
                if (!(response instanceof _response.Response)) {
                  response = new _response.Response({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: response.data
                  });
                }

                // Throw the response error if we did not receive
                // a successfull response

                if (response.isSuccess()) {
                  _context.next = 11;
                  break;
                }

                throw response.error;

              case 11:
                return _context.abrupt('return', response);

              case 12:
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
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2() {
        return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return _get(Object.getPrototypeOf(CacheRequest.prototype), 'cancel', this).call(this);

              case 2:
                return _context2.abrupt('return', this.rack.cancel());

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function cancel() {
        return _ref2.apply(this, arguments);
      }

      return cancel;
    }()
  }, {
    key: 'toPlainObject',
    value: function toPlainObject() {
      var obj = _get(Object.getPrototypeOf(CacheRequest.prototype), 'toPlainObject', this).call(this);
      obj.query = this.query;
      obj.appKey = this.appKey;
      obj.collection = this.collection;
      obj.entityId = this.entityId;
      return obj;
    }
  }, {
    key: 'url',
    get: function get() {
      return _get(Object.getPrototypeOf(CacheRequest.prototype), 'url', this);
    },
    set: function set(urlString) {
      _set(Object.getPrototypeOf(CacheRequest.prototype), 'url', urlString, this);
      var pathname = global.escape(_url2.default.parse(urlString).pathname);
      var pattern = new _urlPattern2.default('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');

      var _ref3 = pattern.match(pathname) || {};

      var appKey = _ref3.appKey;
      var collection = _ref3.collection;
      var entityId = _ref3.entityId;

      this.appKey = !!appKey ? global.unescape(appKey) : appKey;
      this.collection = !!collection ? global.unescape(collection) : collection;
      this.entityId = !!entityId ? global.unescape(entityId) : entityId;
    }
  }]);

  return CacheRequest;
}(_request.Request);