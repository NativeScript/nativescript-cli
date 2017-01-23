'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BaseError = function (_ExtendableError) {
  _inherits(BaseError, _ExtendableError);

  function BaseError(name) {
    var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'An error occurred.';
    var debug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var code = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : -1;
    var kinveyRequestId = arguments[4];

    _classCallCheck(this, BaseError);

    var _this = _possibleConstructorReturn(this, (BaseError.__proto__ || Object.getPrototypeOf(BaseError)).call(this));

    _this.name = name || _this.constructor.name;
    _this.message = message;
    _this.debug = debug;
    _this.code = code;
    _this.kinveyRequestId = kinveyRequestId;
    _this.stack = new Error(message).stack;
    return _this;
  }

  return BaseError;
}(_es6Error2.default);

exports.default = BaseError;