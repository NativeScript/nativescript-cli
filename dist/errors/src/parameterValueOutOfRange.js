'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _kinvey = require('./kinvey');

var _kinvey2 = _interopRequireDefault(_kinvey);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ParameterValueOutOfRangeError = function (_KinveyError) {
  _inherits(ParameterValueOutOfRangeError, _KinveyError);

  function ParameterValueOutOfRangeError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'The value specified for one of the request parameters is out of range.';
    var debug = arguments[1];
    var code = arguments[2];

    _classCallCheck(this, ParameterValueOutOfRangeError);

    return _possibleConstructorReturn(this, (ParameterValueOutOfRangeError.__proto__ || Object.getPrototypeOf(ParameterValueOutOfRangeError)).call(this, 'ParameterValueOutOfRangeError', message, debug, code));
  }

  return ParameterValueOutOfRangeError;
}(_kinvey2.default);

exports.default = ParameterValueOutOfRangeError;