'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cloneDeep = require('lodash/cloneDeep');

var _cloneDeep2 = _interopRequireDefault(_cloneDeep);

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * @private
 */
exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(request) {
    var headers, method, url, contentType, body, str;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (request) {
              _context.next = 2;
              break;
            }

            throw new Error('No request provided.');

          case 2:
            headers = request.headers, method = request.method, url = request.url;
            contentType = headers.get('Content-Type') || 'application/json';
            body = (0, _cloneDeep2.default)(request.body);


            if (body && typeof body !== 'string') {
              if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
                str = [];

                Object.keys(body).forEach(function (key) {
                  str.push(global.encodeURIComponent(key) + '=' + global.encodeURIComponent(body[key]));
                });
                body = str.join('&');
              } else if (contentType.indexOf('application/json') === 0) {
                body = JSON.stringify(body);
              }

              headers.set('Content-Type', contentType);
            }

            return _context.abrupt('return', new _request2.default({
              headers: headers,
              method: method,
              url: url,
              body: body
            }));

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function serialize(_x) {
    return _ref.apply(this, arguments);
  }

  return serialize;
}();