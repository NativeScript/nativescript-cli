'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var JSONParseError = function (_BaseError) {
  _inherits(JSONParseError, _BaseError);

  function JSONParseError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Unable to parse the JSON in the request.';
    var debug = arguments[1];
    var code = arguments[2];
    var kinveyRequestId = arguments[3];

    _classCallCheck(this, JSONParseError);

    return _possibleConstructorReturn(this, (JSONParseError.__proto__ || Object.getPrototypeOf(JSONParseError)).call(this, 'JSONParseError', message, debug, code, kinveyRequestId));
  }

  return JSONParseError;
}(_base2.default);

exports.default = JSONParseError;