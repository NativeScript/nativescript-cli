'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyncError = exports.ServerError = exports.QueryError = exports.ParameterValueOutOfRangeError = exports.NoResponseError = exports.NotFoundError = exports.NoActiveUserError = exports.NoNetworkConnectionError = exports.MissingRequestParameterError = exports.MissingRequestHeaderError = exports.MissingQueryError = exports.JSONParseError = exports.InvalidQuerySyntaxError = exports.InvalidIdentifierError = exports.InvalidCredentialsError = exports.InsufficientCredentialsError = exports.IncompleteRequestBodyError = exports.FeatureUnavailableError = exports.ActiveUserError = exports.KinveyError = undefined;

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var KinveyError = exports.KinveyError = function (_ExtendableError) {
  _inherits(KinveyError, _ExtendableError);

  function KinveyError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'An error has occurred.';
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

    _classCallCheck(this, KinveyError);

    var _this = _possibleConstructorReturn(this, (KinveyError.__proto__ || Object.getPrototypeOf(KinveyError)).call(this, message));

    _this.debug = debug;
    _this.code = code;
    return _this;
  }

  return KinveyError;
}(_es6Error2.default);

var ActiveUserError = exports.ActiveUserError = function (_KinveyError) {
  _inherits(ActiveUserError, _KinveyError);

  function ActiveUserError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'An active user already exists.';
    var debug = arguments[1];

    _classCallCheck(this, ActiveUserError);

    return _possibleConstructorReturn(this, (ActiveUserError.__proto__ || Object.getPrototypeOf(ActiveUserError)).call(this, message, debug));
  }

  return ActiveUserError;
}(KinveyError);

var FeatureUnavailableError = exports.FeatureUnavailableError = function (_KinveyError2) {
  _inherits(FeatureUnavailableError, _KinveyError2);

  function FeatureUnavailableError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Requested functionality is unavailable in this API version.';
    var debug = arguments[1];

    _classCallCheck(this, FeatureUnavailableError);

    return _possibleConstructorReturn(this, (FeatureUnavailableError.__proto__ || Object.getPrototypeOf(FeatureUnavailableError)).call(this, message, debug));
  }

  return FeatureUnavailableError;
}(KinveyError);

var IncompleteRequestBodyError = exports.IncompleteRequestBodyError = function (_KinveyError3) {
  _inherits(IncompleteRequestBodyError, _KinveyError3);

  function IncompleteRequestBodyError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ' The request body is either missing or incomplete.';
    var debug = arguments[1];

    _classCallCheck(this, IncompleteRequestBodyError);

    return _possibleConstructorReturn(this, (IncompleteRequestBodyError.__proto__ || Object.getPrototypeOf(IncompleteRequestBodyError)).call(this, message, debug));
  }

  return IncompleteRequestBodyError;
}(KinveyError);

var InsufficientCredentialsError = exports.InsufficientCredentialsError = function (_KinveyError4) {
  _inherits(InsufficientCredentialsError, _KinveyError4);

  function InsufficientCredentialsError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'The credentials used to authenticate this request are not authorized to run ' + 'this operation. Please retry your request with appropriate credentials.';
    var debug = arguments[1];

    _classCallCheck(this, InsufficientCredentialsError);

    return _possibleConstructorReturn(this, (InsufficientCredentialsError.__proto__ || Object.getPrototypeOf(InsufficientCredentialsError)).call(this, message, debug));
  }

  return InsufficientCredentialsError;
}(KinveyError);

var InvalidCredentialsError = exports.InvalidCredentialsError = function (_KinveyError5) {
  _inherits(InvalidCredentialsError, _KinveyError5);

  function InvalidCredentialsError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ' Invalid credentials. Please retry your request with correct credentials.';
    var debug = arguments[1];

    _classCallCheck(this, InvalidCredentialsError);

    return _possibleConstructorReturn(this, (InvalidCredentialsError.__proto__ || Object.getPrototypeOf(InvalidCredentialsError)).call(this, message, debug));
  }

  return InvalidCredentialsError;
}(KinveyError);

var InvalidIdentifierError = exports.InvalidIdentifierError = function (_KinveyError6) {
  _inherits(InvalidIdentifierError, _KinveyError6);

  function InvalidIdentifierError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'One of more identifier names in the request has an invalid format.';
    var debug = arguments[1];

    _classCallCheck(this, InvalidIdentifierError);

    return _possibleConstructorReturn(this, (InvalidIdentifierError.__proto__ || Object.getPrototypeOf(InvalidIdentifierError)).call(this, message, debug));
  }

  return InvalidIdentifierError;
}(KinveyError);

var InvalidQuerySyntaxError = exports.InvalidQuerySyntaxError = function (_KinveyError7) {
  _inherits(InvalidQuerySyntaxError, _KinveyError7);

  function InvalidQuerySyntaxError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'The query string in the request has an invalid syntax.';
    var debug = arguments[1];

    _classCallCheck(this, InvalidQuerySyntaxError);

    return _possibleConstructorReturn(this, (InvalidQuerySyntaxError.__proto__ || Object.getPrototypeOf(InvalidQuerySyntaxError)).call(this, message, debug));
  }

  return InvalidQuerySyntaxError;
}(KinveyError);

var JSONParseError = exports.JSONParseError = function (_KinveyError8) {
  _inherits(JSONParseError, _KinveyError8);

  function JSONParseError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Unable to parse the JSON in the request.';
    var debug = arguments[1];

    _classCallCheck(this, JSONParseError);

    return _possibleConstructorReturn(this, (JSONParseError.__proto__ || Object.getPrototypeOf(JSONParseError)).call(this, message, debug));
  }

  return JSONParseError;
}(KinveyError);

var MissingQueryError = exports.MissingQueryError = function (_KinveyError9) {
  _inherits(MissingQueryError, _KinveyError9);

  function MissingQueryError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'The request is missing a query string.';
    var debug = arguments[1];

    _classCallCheck(this, MissingQueryError);

    return _possibleConstructorReturn(this, (MissingQueryError.__proto__ || Object.getPrototypeOf(MissingQueryError)).call(this, message, debug));
  }

  return MissingQueryError;
}(KinveyError);

var MissingRequestHeaderError = exports.MissingRequestHeaderError = function (_KinveyError10) {
  _inherits(MissingRequestHeaderError, _KinveyError10);

  function MissingRequestHeaderError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'The request is missing a required header.';
    var debug = arguments[1];

    _classCallCheck(this, MissingRequestHeaderError);

    return _possibleConstructorReturn(this, (MissingRequestHeaderError.__proto__ || Object.getPrototypeOf(MissingRequestHeaderError)).call(this, message, debug));
  }

  return MissingRequestHeaderError;
}(KinveyError);

var MissingRequestParameterError = exports.MissingRequestParameterError = function (_KinveyError11) {
  _inherits(MissingRequestParameterError, _KinveyError11);

  function MissingRequestParameterError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'A required parameter is missing from the request.';
    var debug = arguments[1];

    _classCallCheck(this, MissingRequestParameterError);

    return _possibleConstructorReturn(this, (MissingRequestParameterError.__proto__ || Object.getPrototypeOf(MissingRequestParameterError)).call(this, message, debug));
  }

  return MissingRequestParameterError;
}(KinveyError);

var NoNetworkConnectionError = exports.NoNetworkConnectionError = function (_KinveyError12) {
  _inherits(NoNetworkConnectionError, _KinveyError12);

  function NoNetworkConnectionError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'You do not have a network connect.';
    var debug = arguments[1];

    _classCallCheck(this, NoNetworkConnectionError);

    return _possibleConstructorReturn(this, (NoNetworkConnectionError.__proto__ || Object.getPrototypeOf(NoNetworkConnectionError)).call(this, message, debug));
  }

  return NoNetworkConnectionError;
}(KinveyError);

var NoActiveUserError = exports.NoActiveUserError = function (_KinveyError13) {
  _inherits(NoActiveUserError, _KinveyError13);

  function NoActiveUserError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'There is not an active user.';
    var debug = arguments[1];

    _classCallCheck(this, NoActiveUserError);

    return _possibleConstructorReturn(this, (NoActiveUserError.__proto__ || Object.getPrototypeOf(NoActiveUserError)).call(this, message, debug));
  }

  return NoActiveUserError;
}(KinveyError);

var NotFoundError = exports.NotFoundError = function (_KinveyError14) {
  _inherits(NotFoundError, _KinveyError14);

  function NotFoundError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'The item was not found.';
    var debug = arguments[1];

    _classCallCheck(this, NotFoundError);

    return _possibleConstructorReturn(this, (NotFoundError.__proto__ || Object.getPrototypeOf(NotFoundError)).call(this, message, debug));
  }

  return NotFoundError;
}(KinveyError);

var NoResponseError = exports.NoResponseError = function (_KinveyError15) {
  _inherits(NoResponseError, _KinveyError15);

  function NoResponseError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'No response was provided.';
    var debug = arguments[1];

    _classCallCheck(this, NoResponseError);

    return _possibleConstructorReturn(this, (NoResponseError.__proto__ || Object.getPrototypeOf(NoResponseError)).call(this, message, debug));
  }

  return NoResponseError;
}(KinveyError);

var ParameterValueOutOfRangeError = exports.ParameterValueOutOfRangeError = function (_KinveyError16) {
  _inherits(ParameterValueOutOfRangeError, _KinveyError16);

  function ParameterValueOutOfRangeError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'The value specified for one of the request parameters is out of range.';
    var debug = arguments[1];

    _classCallCheck(this, ParameterValueOutOfRangeError);

    return _possibleConstructorReturn(this, (ParameterValueOutOfRangeError.__proto__ || Object.getPrototypeOf(ParameterValueOutOfRangeError)).call(this, message, debug));
  }

  return ParameterValueOutOfRangeError;
}(KinveyError);

var QueryError = exports.QueryError = function (_KinveyError17) {
  _inherits(QueryError, _KinveyError17);

  function QueryError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'An error occurred on the query.';
    var debug = arguments[1];

    _classCallCheck(this, QueryError);

    return _possibleConstructorReturn(this, (QueryError.__proto__ || Object.getPrototypeOf(QueryError)).call(this, message, debug));
  }

  return QueryError;
}(KinveyError);

var ServerError = exports.ServerError = function (_KinveyError18) {
  _inherits(ServerError, _KinveyError18);

  function ServerError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'An error occurred on the server';
    var debug = arguments[1];

    _classCallCheck(this, ServerError);

    return _possibleConstructorReturn(this, (ServerError.__proto__ || Object.getPrototypeOf(ServerError)).call(this, message, debug));
  }

  return ServerError;
}(KinveyError);

var SyncError = exports.SyncError = function (_KinveyError19) {
  _inherits(SyncError, _KinveyError19);

  function SyncError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'An error occurred during sync';
    var debug = arguments[1];

    _classCallCheck(this, SyncError);

    return _possibleConstructorReturn(this, (SyncError.__proto__ || Object.getPrototypeOf(SyncError)).call(this, message, debug));
  }

  return SyncError;
}(KinveyError);