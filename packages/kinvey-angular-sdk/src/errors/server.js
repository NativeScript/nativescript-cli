"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _base = _interopRequireDefault(require("./base"));

var ServerError =
/*#__PURE__*/
function (_BaseError) {
  (0, _inherits2.default)(ServerError, _BaseError);

  function ServerError() {
    var _getPrototypeOf2;

    var _this;

    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'An error occurred on the server.';
    var debug = arguments.length > 1 ? arguments[1] : undefined;
    var code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
    (0, _classCallCheck2.default)(this, ServerError);

    for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      args[_key - 3] = arguments[_key];
    }

    // Pass remaining arguments (including vendor specific ones) to parent constructor
    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(ServerError)).call.apply(_getPrototypeOf2, [this, message, debug, code].concat(args))); // Maintains proper stack trace for where our error was thrown (only available on V8)

    if (Error.captureStackTrace) {
      Error.captureStackTrace((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), ServerError);
    } // Custom debugging information


    _this.name = 'ServerError';
    return _this;
  }

  return ServerError;
}(_base.default);

exports.default = ServerError;