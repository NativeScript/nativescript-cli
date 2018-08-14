'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _http = require('tns-core-modules/http');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(request) {
    var response, data;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _http.request)({
              headers: request.headers,
              method: request.method,
              url: request.url,
              content: request.body
            });

          case 2:
            response = _context.sent;
            data = response.content.raw;


            try {
              data = response.content.toString();
            } catch (e) {
              // TODO: Log error
            }

            return _context.abrupt('return', {
              statusCode: response.statusCode,
              headers: response.headers,
              data: data
            });

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function http(_x) {
    return _ref.apply(this, arguments);
  }

  return http;
}();