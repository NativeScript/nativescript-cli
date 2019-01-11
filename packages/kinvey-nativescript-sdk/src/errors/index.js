"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ActiveUserError", {
  enumerable: true,
  get: function get() {
    return _activeUser.default;
  }
});
Object.defineProperty(exports, "APIVersionNotAvailableError", {
  enumerable: true,
  get: function get() {
    return _apiVersionNotAvailable.default;
  }
});
Object.defineProperty(exports, "APIVersionNotImplementedError", {
  enumerable: true,
  get: function get() {
    return _apiVersionNotImplemented.default;
  }
});
Object.defineProperty(exports, "AppProblemError", {
  enumerable: true,
  get: function get() {
    return _appProblem.default;
  }
});
Object.defineProperty(exports, "BadRequestError", {
  enumerable: true,
  get: function get() {
    return _badRequest.default;
  }
});
Object.defineProperty(exports, "BaseError", {
  enumerable: true,
  get: function get() {
    return _base.default;
  }
});
Object.defineProperty(exports, "BLError", {
  enumerable: true,
  get: function get() {
    return _bl.default;
  }
});
Object.defineProperty(exports, "CORSDisabledError", {
  enumerable: true,
  get: function get() {
    return _corsDisabled.default;
  }
});
Object.defineProperty(exports, "DuplicateEndUsersError", {
  enumerable: true,
  get: function get() {
    return _duplicateEndUsers.default;
  }
});
Object.defineProperty(exports, "FeatureUnavailableError", {
  enumerable: true,
  get: function get() {
    return _featureUnavailable.default;
  }
});
Object.defineProperty(exports, "IncompleteRequestBodyError", {
  enumerable: true,
  get: function get() {
    return _incompleteRequestBody.default;
  }
});
Object.defineProperty(exports, "IndirectCollectionAccessDisallowedError", {
  enumerable: true,
  get: function get() {
    return _indirectCollectionAccessDisallowed.default;
  }
});
Object.defineProperty(exports, "InsufficientCredentialsError", {
  enumerable: true,
  get: function get() {
    return _insufficientCredentials.default;
  }
});
Object.defineProperty(exports, "InvalidCachedQueryError", {
  enumerable: true,
  get: function get() {
    return _invalidCachedQuery.default;
  }
});
Object.defineProperty(exports, "InvalidCredentialsError", {
  enumerable: true,
  get: function get() {
    return _invalidCredentials.default;
  }
});
Object.defineProperty(exports, "InvalidIdentifierError", {
  enumerable: true,
  get: function get() {
    return _invalidIdentifier.default;
  }
});
Object.defineProperty(exports, "InvalidQuerySyntaxError", {
  enumerable: true,
  get: function get() {
    return _invalidQuerySyntax.default;
  }
});
Object.defineProperty(exports, "JSONParseError", {
  enumerable: true,
  get: function get() {
    return _jsonParse.default;
  }
});
Object.defineProperty(exports, "KinveyError", {
  enumerable: true,
  get: function get() {
    return _kinvey.default;
  }
});
Object.defineProperty(exports, "KinveyInternalErrorRetry", {
  enumerable: true,
  get: function get() {
    return _kinveyInternalErrorRetry.default;
  }
});
Object.defineProperty(exports, "KinveyInternalErrorStop", {
  enumerable: true,
  get: function get() {
    return _kinveyInternalErrorStop.default;
  }
});
Object.defineProperty(exports, "MissingConfigurationError", {
  enumerable: true,
  get: function get() {
    return _missingConfiguration.default;
  }
});
Object.defineProperty(exports, "MissingQueryError", {
  enumerable: true,
  get: function get() {
    return _missingQuery.default;
  }
});
Object.defineProperty(exports, "MissingRequestHeaderError", {
  enumerable: true,
  get: function get() {
    return _missingRequestHeader.default;
  }
});
Object.defineProperty(exports, "MissingRequestParameterError", {
  enumerable: true,
  get: function get() {
    return _missingRequestParameter.default;
  }
});
Object.defineProperty(exports, "MobileIdentityConnectError", {
  enumerable: true,
  get: function get() {
    return _mobileIdentityConnect.default;
  }
});
Object.defineProperty(exports, "NetworkConnectionError", {
  enumerable: true,
  get: function get() {
    return _networkConnection.default;
  }
});
Object.defineProperty(exports, "NoActiveUserError", {
  enumerable: true,
  get: function get() {
    return _noActiveUser.default;
  }
});
Object.defineProperty(exports, "NoResponseError", {
  enumerable: true,
  get: function get() {
    return _noResponse.default;
  }
});
Object.defineProperty(exports, "NotFoundError", {
  enumerable: true,
  get: function get() {
    return _notFound.default;
  }
});
Object.defineProperty(exports, "ParameterValueOutOfRangeError", {
  enumerable: true,
  get: function get() {
    return _parameterValueOutOfRange.default;
  }
});
Object.defineProperty(exports, "PopupError", {
  enumerable: true,
  get: function get() {
    return _popup.default;
  }
});
Object.defineProperty(exports, "QueryError", {
  enumerable: true,
  get: function get() {
    return _query.default;
  }
});
Object.defineProperty(exports, "ResultSetSizeExceededError", {
  enumerable: true,
  get: function get() {
    return _resultSetSizeExceeded.default;
  }
});
Object.defineProperty(exports, "ServerError", {
  enumerable: true,
  get: function get() {
    return _server.default;
  }
});
Object.defineProperty(exports, "StaleRequestError", {
  enumerable: true,
  get: function get() {
    return _staleRequest.default;
  }
});
Object.defineProperty(exports, "SyncError", {
  enumerable: true,
  get: function get() {
    return _sync.default;
  }
});
Object.defineProperty(exports, "TimeoutError", {
  enumerable: true,
  get: function get() {
    return _timeout.default;
  }
});
Object.defineProperty(exports, "UserAlreadyExistsError", {
  enumerable: true,
  get: function get() {
    return _userAlreadyExists.default;
  }
});
Object.defineProperty(exports, "WritesToCollectionDisallowedError", {
  enumerable: true,
  get: function get() {
    return _writesToCollectionDisallowed.default;
  }
});

var _activeUser = _interopRequireDefault(require("./activeUser"));

var _apiVersionNotAvailable = _interopRequireDefault(require("./apiVersionNotAvailable"));

var _apiVersionNotImplemented = _interopRequireDefault(require("./apiVersionNotImplemented"));

var _appProblem = _interopRequireDefault(require("./appProblem"));

var _badRequest = _interopRequireDefault(require("./badRequest"));

var _base = _interopRequireDefault(require("./base"));

var _bl = _interopRequireDefault(require("./bl"));

var _corsDisabled = _interopRequireDefault(require("./corsDisabled"));

var _duplicateEndUsers = _interopRequireDefault(require("./duplicateEndUsers"));

var _featureUnavailable = _interopRequireDefault(require("./featureUnavailable"));

var _incompleteRequestBody = _interopRequireDefault(require("./incompleteRequestBody"));

var _indirectCollectionAccessDisallowed = _interopRequireDefault(require("./indirectCollectionAccessDisallowed"));

var _insufficientCredentials = _interopRequireDefault(require("./insufficientCredentials"));

var _invalidCachedQuery = _interopRequireDefault(require("./invalidCachedQuery"));

var _invalidCredentials = _interopRequireDefault(require("./invalidCredentials"));

var _invalidIdentifier = _interopRequireDefault(require("./invalidIdentifier"));

var _invalidQuerySyntax = _interopRequireDefault(require("./invalidQuerySyntax"));

var _jsonParse = _interopRequireDefault(require("./jsonParse"));

var _kinvey = _interopRequireDefault(require("./kinvey"));

var _kinveyInternalErrorRetry = _interopRequireDefault(require("./kinveyInternalErrorRetry"));

var _kinveyInternalErrorStop = _interopRequireDefault(require("./kinveyInternalErrorStop"));

var _missingConfiguration = _interopRequireDefault(require("./missingConfiguration"));

var _missingQuery = _interopRequireDefault(require("./missingQuery"));

var _missingRequestHeader = _interopRequireDefault(require("./missingRequestHeader"));

var _missingRequestParameter = _interopRequireDefault(require("./missingRequestParameter"));

var _mobileIdentityConnect = _interopRequireDefault(require("./mobileIdentityConnect"));

var _networkConnection = _interopRequireDefault(require("./networkConnection"));

var _noActiveUser = _interopRequireDefault(require("./noActiveUser"));

var _noResponse = _interopRequireDefault(require("./noResponse"));

var _notFound = _interopRequireDefault(require("./notFound"));

var _parameterValueOutOfRange = _interopRequireDefault(require("./parameterValueOutOfRange"));

var _popup = _interopRequireDefault(require("./popup"));

var _query = _interopRequireDefault(require("./query"));

var _resultSetSizeExceeded = _interopRequireDefault(require("./resultSetSizeExceeded"));

var _server = _interopRequireDefault(require("./server"));

var _staleRequest = _interopRequireDefault(require("./staleRequest"));

var _sync = _interopRequireDefault(require("./sync"));

var _timeout = _interopRequireDefault(require("./timeout"));

var _userAlreadyExists = _interopRequireDefault(require("./userAlreadyExists"));

var _writesToCollectionDisallowed = _interopRequireDefault(require("./writesToCollectionDisallowed"));