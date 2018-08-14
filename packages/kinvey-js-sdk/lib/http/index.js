'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyHeaders = exports.Headers = exports.RequestMethod = exports.Request = exports.execute = undefined;

/**
 * @private
 */
var execute = exports.execute = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(request) {
    var serializedRequest, responseObject, response, parsedResponse;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _serialize2.default)(request);

          case 2:
            serializedRequest = _context2.sent;
            _context2.next = 5;
            return http({
              headers: serializedRequest.headers.toObject(),
              method: serializedRequest.method,
              url: serializedRequest.url,
              body: serializedRequest.body
            });

          case 5:
            responseObject = _context2.sent;


            // Create a response
            response = new _response2.default({
              statusCode: responseObject.statusCode,
              headers: responseObject.headers,
              data: responseObject.data
            });

            // Parse response

            _context2.next = 9;
            return (0, _parse2.default)(response);

          case 9:
            parsedResponse = _context2.sent;

            if (!parsedResponse.isSuccess()) {
              _context2.next = 12;
              break;
            }

            return _context2.abrupt('return', parsedResponse);

          case 12:
            throw parsedResponse.error;

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function execute(_x) {
    return _ref2.apply(this, arguments);
  };
}();

// Export


exports.use = use;

var _utils = require('./utils');

Object.keys(_utils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _utils[key];
    }
  });
});

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

var _serialize = require('./serialize');

var _serialize2 = _interopRequireDefault(_serialize);

var _response = require('./response');

var _response2 = _interopRequireDefault(_response);

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _headers = require('./headers');

var _headers2 = _interopRequireDefault(_headers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var http = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            throw new Error('You must override the default http function.');

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function http() {
    return _ref.apply(this, arguments);
  };
}();

/**
 * @private
 */
function use(customHttp) {
  http = customHttp;
}exports.Request = _request2.default;
exports.RequestMethod = _request.RequestMethod;
exports.Headers = _headers2.default;
exports.KinveyHeaders = _headers.KinveyHeaders;