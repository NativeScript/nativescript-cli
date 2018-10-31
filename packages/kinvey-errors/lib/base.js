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

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

var BaseError =
/*#__PURE__*/
function (_Error) {
  (0, _inherits2.default)(BaseError, _Error);

  function BaseError() {
    var _getPrototypeOf2;

    var _this;

    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'An error occurred.';
    var debug = arguments.length > 1 ? arguments[1] : undefined;
    var code = arguments.length > 2 ? arguments[2] : undefined;
    var kinveyRequestId = arguments.length > 3 ? arguments[3] : undefined;
    (0, _classCallCheck2.default)(this, BaseError);

    for (var _len = arguments.length, args = new Array(_len > 4 ? _len - 4 : 0), _key = 4; _key < _len; _key++) {
      args[_key - 4] = arguments[_key];
    }

    // Pass remaining arguments (including vendor specific ones) to parent constructor
    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(BaseError)).call.apply(_getPrototypeOf2, [this].concat(args))); // Maintains proper stack trace for where our error was thrown (only available on V8)

    if (Error.captureStackTrace) {
      Error.captureStackTrace((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), BaseError);
    } // Custom debugging information


    _this.name = 'BaseError';
    _this.message = message;
    _this.debug = debug;
    _this.code = code;
    _this.kinveyRequestId = kinveyRequestId;
    return _this;
  }

  return BaseError;
}((0, _wrapNativeSuper2.default)(Error));

exports.default = BaseError;