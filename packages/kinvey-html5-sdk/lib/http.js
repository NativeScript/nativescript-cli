'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(request) {
    var response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            response = void 0;
            _context.prev = 1;
            _context.next = 4;
            return (0, _axios2.default)({
              headers: request.headers,
              method: request.method,
              url: request.url,
              data: request.body
            });

          case 4:
            response = _context.sent;
            _context.next = 24;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context['catch'](1);

            if (!_context.t0.response) {
              _context.next = 13;
              break;
            }

            // eslint-disable-next-line prefer-destructuring
            response = _context.t0.response;
            _context.next = 24;
            break;

          case 13:
            if (!_context.t0.request) {
              _context.next = 23;
              break;
            }

            if (!(_context.t0.code === 'ESOCKETTIMEDOUT' || _context.t0.code === 'ETIMEDOUT' || _context.t0.code === 'ECONNABORTED')) {
              _context.next = 18;
              break;
            }

            throw new Error('The network request timed out.');

          case 18:
            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 20;
              break;
            }

            throw new Error('You do not have a network connection.');

          case 20:
            throw _context.t0;

          case 23:
            throw _context.t0;

          case 24:
            return _context.abrupt('return', { statusCode: response.status, headers: response.headers, data: response.data });

          case 25:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[1, 7]]);
  }));

  function http(_x) {
    return _ref.apply(this, arguments);
  }

  return http;
}();