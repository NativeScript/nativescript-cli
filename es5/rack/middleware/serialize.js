'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SerializeMiddleware = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _middleware = require('../middleware');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 */

var SerializeMiddleware = exports.SerializeMiddleware = function (_KinveyMiddleware) {
  _inherits(SerializeMiddleware, _KinveyMiddleware);

  function SerializeMiddleware() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Serialize Middleware' : arguments[0];

    _classCallCheck(this, SerializeMiddleware);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SerializeMiddleware).call(this, name));
  }

  _createClass(SerializeMiddleware, [{
    key: 'handle',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(request) {
        var contentType, body, str, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _step$value, key;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _get(Object.getPrototypeOf(SerializeMiddleware.prototype), 'handle', this).call(this, request);

              case 2:
                request = _context.sent;

                if (!(request && request.body)) {
                  _context.next = 33;
                  break;
                }

                contentType = request.headers.get('content-type');

                if (!contentType) {
                  _context.next = 33;
                  break;
                }

                if (!(contentType.indexOf('application/json') === 0)) {
                  _context.next = 10;
                  break;
                }

                request.body = JSON.stringify(request.body);
                _context.next = 33;
                break;

              case 10:
                if (!(contentType.indexOf('application/x-www-form-urlencoded') === 0)) {
                  _context.next = 33;
                  break;
                }

                body = request.body;
                str = [];
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 16;


                for (_iterator = body[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  _step$value = _slicedToArray(_step.value, 1);
                  key = _step$value[0];

                  str.push(global.encodeURIComponent(key) + '=' + global.encodeURIComponent(body[key]));
                }

                _context.next = 24;
                break;

              case 20:
                _context.prev = 20;
                _context.t0 = _context['catch'](16);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 24:
                _context.prev = 24;
                _context.prev = 25;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 27:
                _context.prev = 27;

                if (!_didIteratorError) {
                  _context.next = 30;
                  break;
                }

                throw _iteratorError;

              case 30:
                return _context.finish(27);

              case 31:
                return _context.finish(24);

              case 32:
                request.body = str.join('&');

              case 33:
                return _context.abrupt('return', request);

              case 34:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[16, 20, 24, 32], [25,, 27, 31]]);
      }));

      function handle(_x2) {
        return ref.apply(this, arguments);
      }

      return handle;
    }()
  }]);

  return SerializeMiddleware;
}(_middleware.KinveyMiddleware);