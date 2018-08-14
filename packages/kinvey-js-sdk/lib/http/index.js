'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeActiveUser = exports.setActiveUser = exports.getActiveUser = exports.formatKinveyBaasUrl = exports.formatKinveyAuthUrl = exports.RequestMethod = exports.KinveyRequest = exports.Request = exports.Auth = exports.execute = undefined;

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

var _headers = require('./headers');

Object.defineProperty(exports, 'Auth', {
  enumerable: true,
  get: function get() {
    return _headers.Auth;
  }
});

var _request = require('./request');

Object.defineProperty(exports, 'Request', {
  enumerable: true,
  get: function get() {
    return _request.Request;
  }
});
Object.defineProperty(exports, 'KinveyRequest', {
  enumerable: true,
  get: function get() {
    return _request.KinveyRequest;
  }
});
Object.defineProperty(exports, 'RequestMethod', {
  enumerable: true,
  get: function get() {
    return _request.RequestMethod;
  }
});
Object.defineProperty(exports, 'formatKinveyAuthUrl', {
  enumerable: true,
  get: function get() {
    return _request.formatKinveyAuthUrl;
  }
});
Object.defineProperty(exports, 'formatKinveyBaasUrl', {
  enumerable: true,
  get: function get() {
    return _request.formatKinveyBaasUrl;
  }
});

var _session = require('./session');

Object.defineProperty(exports, 'getActiveUser', {
  enumerable: true,
  get: function get() {
    return _session.getActiveUser;
  }
});
Object.defineProperty(exports, 'setActiveUser', {
  enumerable: true,
  get: function get() {
    return _session.setActiveUser;
  }
});
Object.defineProperty(exports, 'removeActiveUser', {
  enumerable: true,
  get: function get() {
    return _session.removeActiveUser;
  }
});

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

var _serialize = require('./serialize');

var _serialize2 = _interopRequireDefault(_serialize);

var _response = require('./response');

var _response2 = _interopRequireDefault(_response);

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
function use(httpAdapter, sessionStore) {
  http = httpAdapter;
  (0, _session.use)(sessionStore);
}