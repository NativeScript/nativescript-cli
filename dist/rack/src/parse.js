'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParseMiddleware = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _middleware = require('./middleware');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// eslint-disable-line no-unused-vars

/**
 * @private
 */
var ParseMiddleware = exports.ParseMiddleware = function (_KinveyMiddleware) {
  _inherits(ParseMiddleware, _KinveyMiddleware);

  function ParseMiddleware() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Parse Middleware' : arguments[0];

    _classCallCheck(this, ParseMiddleware);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ParseMiddleware).call(this, name));
  }

  _createClass(ParseMiddleware, [{
    key: 'handle',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(request, response) {
        var contentType;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (response && response.data) {
                  contentType = response.headers['content-type'] || response.headers['Content-Type'];


                  if (contentType) {
                    if (contentType.indexOf('application/json') === 0) {
                      try {
                        response.data = JSON.parse(response.data);
                      } catch (error) {
                        // Just catch the error
                      }
                    }
                  }
                }

                return _context.abrupt('return', { response: response });

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function handle(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return handle;
    }()
  }]);

  return ParseMiddleware;
}(_middleware.KinveyMiddleware);