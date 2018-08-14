'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cloneDeep = require('lodash/cloneDeep');

var _cloneDeep2 = _interopRequireDefault(_cloneDeep);

var _response = require('./response');

var _response2 = _interopRequireDefault(_response);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * @private
 */
exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(response) {
    var statusCode, headers, data, contentType;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (response) {
              _context.next = 2;
              break;
            }

            throw new Error('No response provided.');

          case 2:
            statusCode = response.statusCode, headers = response.headers;
            data = (0, _cloneDeep2.default)(response.data);

            if (!headers.has('Content-Type')) {
              _context.next = 8;
              break;
            }

            contentType = headers.get('Content-Type');


            if (contentType.indexOf('application/json') === 0) {
              try {
                data = JSON.parse(data);
              } catch (error) {
                // TODO: log error
              }
            }

            return _context.abrupt('return', new _response2.default({
              statusCode: statusCode,
              headers: headers,
              data: data
            }));

          case 8:
            return _context.abrupt('return', response);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function parse(_x) {
    return _ref.apply(this, arguments);
  }

  return parse;
}();