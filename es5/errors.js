'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyncError = exports.ParameterValueOutOfRangeError = exports.NoResponseError = exports.NotFoundError = exports.NoActiveUserError = exports.NoNetworkConnectionError = exports.MissingRequestParameterError = exports.MissingRequestHeaderError = exports.MissingQueryError = exports.JSONParseError = exports.InvalidQuerySyntaxError = exports.InvalidIdentifierError = exports.InvalidCredentialsError = exports.InsufficientCredentialsError = exports.IncompleteRequestBodyError = exports.FeatureUnavailableError = exports.ActiveUserError = exports.KinveyError = undefined;

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var KinveyError = exports.KinveyError = function (_ExtendableError) {
  _inherits(KinveyError, _ExtendableError);

  function KinveyError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'An error has occurred.' : arguments[0];
    var debug = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
    var code = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

    _classCallCheck(this, KinveyError);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyError).call(this, message));

    _this.debug = debug;
    _this.code = code;
    return _this;
  }

  return KinveyError;
}(_es6Error2.default);

var ActiveUserError = exports.ActiveUserError = function (_KinveyError) {
  _inherits(ActiveUserError, _KinveyError);

  function ActiveUserError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'An active user already exists.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, ActiveUserError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ActiveUserError).call(this, message, debug));
  }

  return ActiveUserError;
}(KinveyError);

var FeatureUnavailableError = exports.FeatureUnavailableError = function (_KinveyError2) {
  _inherits(FeatureUnavailableError, _KinveyError2);

  function FeatureUnavailableError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'Requested functionality is unavailable in this API version.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, FeatureUnavailableError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(FeatureUnavailableError).call(this, message, debug));
  }

  return FeatureUnavailableError;
}(KinveyError);

var IncompleteRequestBodyError = exports.IncompleteRequestBodyError = function (_KinveyError3) {
  _inherits(IncompleteRequestBodyError, _KinveyError3);

  function IncompleteRequestBodyError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? ' The request body is either missing or incomplete.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, IncompleteRequestBodyError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(IncompleteRequestBodyError).call(this, message, debug));
  }

  return IncompleteRequestBodyError;
}(KinveyError);

var InsufficientCredentialsError = exports.InsufficientCredentialsError = function (_KinveyError4) {
  _inherits(InsufficientCredentialsError, _KinveyError4);

  function InsufficientCredentialsError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'The credentials used to authenticate this request are not authorized to run ' + 'this operation. Please retry your request with appropriate credentials.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, InsufficientCredentialsError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(InsufficientCredentialsError).call(this, message, debug));
  }

  return InsufficientCredentialsError;
}(KinveyError);

var InvalidCredentialsError = exports.InvalidCredentialsError = function (_KinveyError5) {
  _inherits(InvalidCredentialsError, _KinveyError5);

  function InvalidCredentialsError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? ' Invalid credentials. Please retry your request with correct credentials.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, InvalidCredentialsError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(InvalidCredentialsError).call(this, message, debug));
  }

  return InvalidCredentialsError;
}(KinveyError);

var InvalidIdentifierError = exports.InvalidIdentifierError = function (_KinveyError6) {
  _inherits(InvalidIdentifierError, _KinveyError6);

  function InvalidIdentifierError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'One of more identifier names in the request has an invalid format.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, InvalidIdentifierError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(InvalidIdentifierError).call(this, message, debug));
  }

  return InvalidIdentifierError;
}(KinveyError);

var InvalidQuerySyntaxError = exports.InvalidQuerySyntaxError = function (_KinveyError7) {
  _inherits(InvalidQuerySyntaxError, _KinveyError7);

  function InvalidQuerySyntaxError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'The query string in the request has an invalid syntax.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, InvalidQuerySyntaxError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(InvalidQuerySyntaxError).call(this, message, debug));
  }

  return InvalidQuerySyntaxError;
}(KinveyError);

var JSONParseError = exports.JSONParseError = function (_KinveyError8) {
  _inherits(JSONParseError, _KinveyError8);

  function JSONParseError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'Unable to parse the JSON in the request.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, JSONParseError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(JSONParseError).call(this, message, debug));
  }

  return JSONParseError;
}(KinveyError);

var MissingQueryError = exports.MissingQueryError = function (_KinveyError9) {
  _inherits(MissingQueryError, _KinveyError9);

  function MissingQueryError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'The request is missing a query string.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, MissingQueryError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(MissingQueryError).call(this, message, debug));
  }

  return MissingQueryError;
}(KinveyError);

var MissingRequestHeaderError = exports.MissingRequestHeaderError = function (_KinveyError10) {
  _inherits(MissingRequestHeaderError, _KinveyError10);

  function MissingRequestHeaderError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'The request is missing a required header.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, MissingRequestHeaderError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(MissingRequestHeaderError).call(this, message, debug));
  }

  return MissingRequestHeaderError;
}(KinveyError);

var MissingRequestParameterError = exports.MissingRequestParameterError = function (_KinveyError11) {
  _inherits(MissingRequestParameterError, _KinveyError11);

  function MissingRequestParameterError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'A required parameter is missing from the request.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, MissingRequestParameterError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(MissingRequestParameterError).call(this, message, debug));
  }

  return MissingRequestParameterError;
}(KinveyError);

var NoNetworkConnectionError = exports.NoNetworkConnectionError = function (_KinveyError12) {
  _inherits(NoNetworkConnectionError, _KinveyError12);

  function NoNetworkConnectionError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'You do not have a network connect.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, NoNetworkConnectionError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NoNetworkConnectionError).call(this, message, debug));
  }

  return NoNetworkConnectionError;
}(KinveyError);

var NoActiveUserError = exports.NoActiveUserError = function (_KinveyError13) {
  _inherits(NoActiveUserError, _KinveyError13);

  function NoActiveUserError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'There is not an active user.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, NoActiveUserError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NoActiveUserError).call(this, message, debug));
  }

  return NoActiveUserError;
}(KinveyError);

var NotFoundError = exports.NotFoundError = function (_KinveyError14) {
  _inherits(NotFoundError, _KinveyError14);

  function NotFoundError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'The item was not found.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, NotFoundError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NotFoundError).call(this, message, debug));
  }

  return NotFoundError;
}(KinveyError);

var NoResponseError = exports.NoResponseError = function (_KinveyError15) {
  _inherits(NoResponseError, _KinveyError15);

  function NoResponseError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'No response was provided.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, NoResponseError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NoResponseError).call(this, message, debug));
  }

  return NoResponseError;
}(KinveyError);

var ParameterValueOutOfRangeError = exports.ParameterValueOutOfRangeError = function (_KinveyError16) {
  _inherits(ParameterValueOutOfRangeError, _KinveyError16);

  function ParameterValueOutOfRangeError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'The value specified for one of the request parameters is out of range.' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, ParameterValueOutOfRangeError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ParameterValueOutOfRangeError).call(this, message, debug));
  }

  return ParameterValueOutOfRangeError;
}(KinveyError);

var SyncError = exports.SyncError = function (_KinveyError17) {
  _inherits(SyncError, _KinveyError17);

  function SyncError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'An error occurred during sync' : arguments[0];
    var debug = arguments[1];

    _classCallCheck(this, SyncError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SyncError).call(this, message, debug));
  }

  return SyncError;
}(KinveyError);