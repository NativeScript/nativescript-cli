"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _apiVersionNotAvailable = _interopRequireDefault(require("../errors/apiVersionNotAvailable"));

var _apiVersionNotImplemented = _interopRequireDefault(require("../errors/apiVersionNotImplemented"));

var _appProblem = _interopRequireDefault(require("../errors/appProblem"));

var _badRequest = _interopRequireDefault(require("../errors/badRequest"));

var _bl = _interopRequireDefault(require("../errors/bl"));

var _corsDisabled = _interopRequireDefault(require("../errors/corsDisabled"));

var _duplicateEndUsers = _interopRequireDefault(require("../errors/duplicateEndUsers"));

var _featureUnavailable = _interopRequireDefault(require("../errors/featureUnavailable"));

var _incompleteRequestBody = _interopRequireDefault(require("../errors/incompleteRequestBody"));

var _indirectCollectionAccessDisallowed = _interopRequireDefault(require("../errors/indirectCollectionAccessDisallowed"));

var _insufficientCredentials = _interopRequireDefault(require("../errors/insufficientCredentials"));

var _invalidCredentials = _interopRequireDefault(require("../errors/invalidCredentials"));

var _invalidIdentifier = _interopRequireDefault(require("../errors/invalidIdentifier"));

var _invalidQuerySyntax = _interopRequireDefault(require("../errors/invalidQuerySyntax"));

var _jsonParse = _interopRequireDefault(require("../errors/jsonParse"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _kinveyInternalErrorRetry = _interopRequireDefault(require("../errors/kinveyInternalErrorRetry"));

var _kinveyInternalErrorStop = _interopRequireDefault(require("../errors/kinveyInternalErrorStop"));

var _missingQuery = _interopRequireDefault(require("../errors/missingQuery"));

var _missingRequestHeader = _interopRequireDefault(require("../errors/missingRequestHeader"));

var _missingRequestParameter = _interopRequireDefault(require("../errors/missingRequestParameter"));

var _missingConfiguration = _interopRequireDefault(require("../errors/missingConfiguration"));

var _networkConnection = _interopRequireDefault(require("../errors/networkConnection"));

var _notFound = _interopRequireDefault(require("../errors/notFound"));

var _parameterValueOutOfRange = _interopRequireDefault(require("../errors/parameterValueOutOfRange"));

var _resultSetSizeExceeded = _interopRequireDefault(require("../errors/resultSetSizeExceeded"));

var _server = _interopRequireDefault(require("../errors/server"));

var _staleRequest = _interopRequireDefault(require("../errors/staleRequest"));

var _timeout = _interopRequireDefault(require("../errors/timeout"));

var _userAlreadyExists = _interopRequireDefault(require("../errors/userAlreadyExists"));

var _writesToCollectionDisallowed = _interopRequireDefault(require("../errors/writesToCollectionDisallowed"));

var _headers = require("./headers");

var _utils = require("./utils");

var StatusCode = {
  Ok: 200,
  Created: 201,
  Empty: 204,
  MovedPermanently: 301,
  Found: 302,
  NotModified: 304,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  ServerError: 500
};

var Response =
/*#__PURE__*/
function () {
  function Response(response) {
    (0, _classCallCheck2.default)(this, Response);
    this.statusCode = response.statusCode;
    this.headers = response.headers;
    this.data = response.data;
  }

  (0, _createClass2.default)(Response, [{
    key: "isSuccess",
    value: function isSuccess() {
      return this.statusCode >= 200 && this.statusCode < 300 || this.statusCode === StatusCode.MovedPermanently || this.statusCode === StatusCode.Found || this.statusCode === StatusCode.NotModified || this.statusCode === StatusCode.TemporaryRedirect || this.statusCode === StatusCode.PermanentRedirect;
    }
  }, {
    key: "headers",
    get: function get() {
      return this._headers;
    },
    set: function set(headers) {
      this._headers = new _headers.Headers(headers);
    }
  }, {
    key: "data",
    get: function get() {
      return this._data;
    },
    set: function set(data) {
      this._data = (0, _utils.parse)(this.headers.contentType, data);
    }
  }, {
    key: "error",
    get: function get() {
      if (!this.isSuccess()) {
        var data = this.data || {};
        var name = data.name || data.error;
        var message = data.message || data.description;
        var debug = data.debug;
        var code = this.statusCode;
        var kinveyRequestId = this.headers.get('X-Kinvey-Request-ID');

        if (code === 'ESOCKETTIMEDOUT' || code === 'ETIMEDOUT') {
          return new _timeout.default('The network request timed out.');
        } else if (code === 'ENOENT') {
          return new _networkConnection.default('You do not have a network connection.');
        } else if (name === 'APIVersionNotAvailable') {
          return new _apiVersionNotAvailable.default(message, debug, code, kinveyRequestId);
        } else if (name === 'APIVersionNotImplemented') {
          return new _apiVersionNotImplemented.default(message, debug, code, kinveyRequestId);
        } else if (name === 'AppProblem') {
          return new _appProblem.default(message, debug, code, kinveyRequestId);
        } else if (name === 'AppProblem') {
          return new _appProblem.default(message, debug, code, kinveyRequestId);
        } else if (name === 'BadRequest') {
          return new _badRequest.default(message, debug, code, kinveyRequestId);
        } else if (name === 'BLInternalError' || name === 'BLRuntimeError' || name === 'BLSyntaxError' || name === 'BLTimeoutError' || name === 'BLViolationError') {
          return new _bl.default(message, debug, code, kinveyRequestId);
        } else if (name === 'CORSDisabled') {
          return new _corsDisabled.default(message, debug, code, kinveyRequestId);
        } else if (name === 'DuplicateEndUsers') {
          return new _duplicateEndUsers.default(message, debug, code, kinveyRequestId);
        } else if (name === 'FeatureUnavailable') {
          return new _featureUnavailable.default(message, debug, code, kinveyRequestId);
        } else if (name === 'IncompleteRequestBody') {
          return new _incompleteRequestBody.default(message, debug, code, kinveyRequestId);
        } else if (name === 'IndirectCollectionAccessDisallowed') {
          return new _indirectCollectionAccessDisallowed.default(message, debug, code, kinveyRequestId);
        } else if (name === 'InsufficientCredentials') {
          return new _insufficientCredentials.default(message, debug, code, kinveyRequestId);
        } else if (name === 'InvalidCredentials') {
          return new _invalidCredentials.default(message, debug, code, kinveyRequestId);
        } else if (name === 'InvalidIdentifier') {
          return new _invalidIdentifier.default(message, debug, code, kinveyRequestId);
        } else if (name === 'InvalidQuerySyntax') {
          return new _invalidQuerySyntax.default(message, debug, code, kinveyRequestId);
        } else if (name === 'JSONParseError') {
          return new _jsonParse.default(message, debug, code, kinveyRequestId);
        } else if (name === 'KinveyInternalErrorRetry') {
          return new _kinveyInternalErrorRetry.default(message, debug, code, kinveyRequestId);
        } else if (name === 'KinveyInternalErrorStop') {
          return new _kinveyInternalErrorStop.default(message, debug, code, kinveyRequestId);
        } else if (name === 'MissingQuery') {
          return new _missingQuery.default(message, debug, code, kinveyRequestId);
        } else if (name === 'MissingRequestHeader') {
          return new _missingRequestHeader.default(message, debug, code, kinveyRequestId);
        } else if (name === 'MissingRequestParameter') {
          return new _missingRequestParameter.default(message, debug, code, kinveyRequestId);
        } else if (name === 'MissingConfiguration') {
          return new _missingConfiguration.default(message, debug, code, kinveyRequestId);
        } else if (name === 'EntityNotFound' || name === 'CollectionNotFound' || name === 'AppNotFound' || name === 'UserNotFound' || name === 'BlobNotFound' || name === 'DocumentNotFound') {
          return new _notFound.default(message, debug, code, kinveyRequestId);
        } else if (name === 'ParameterValueOutOfRange') {
          return new _parameterValueOutOfRange.default(message, debug, code, kinveyRequestId);
        } else if (name === 'ResultSetSizeExceeded') {
          return new _resultSetSizeExceeded.default(message, debug, code, kinveyRequestId);
        } else if (name === 'ServerError') {
          return new _server.default(message, debug, code, kinveyRequestId);
        } else if (name === 'StaleRequest') {
          return new _staleRequest.default(message, debug, code, kinveyRequestId);
        } else if (name === 'UserAlreadyExists') {
          return new _userAlreadyExists.default(message, debug, code, kinveyRequestId);
        } else if (name === 'WritesToCollectionDisallowed') {
          return new _writesToCollectionDisallowed.default(message, debug, code, kinveyRequestId);
        } else if (code === StatusCode.Unauthorized || code === StatusCode.Forbidden) {
          return new _insufficientCredentials.default(message, debug, code, kinveyRequestId);
        } else if (code === StatusCode.NotFound) {
          return new _notFound.default(message, debug, code, kinveyRequestId);
        } else if (code === StatusCode.ServerError) {
          return new _server.default(message, debug, code, kinveyRequestId);
        }

        return new _kinvey.default(message, debug, code, kinveyRequestId);
      }

      return null;
    }
  }]);
  return Response;
}();

exports.default = Response;