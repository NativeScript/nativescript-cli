(function() {

  /**
   * Kinvey Error namespace definition. Holds all possible errors.
   * 
   * @namespace
   */
  Kinvey.Error = {
    // Client-side.
    /** @constant */
    OPERATION_DENIED: 'OperationDenied',

    /** @constant */
    REQUEST_FAILED: 'RequestFailed',

    /** @constant */
    RESPONSE_PROBLEM: 'ResponseProblem',

    // Server-side.
    /** @constant */
    ENTITY_NOT_FOUND: 'EntityNotFound',

    /** @constant */
    COLLECTION_NOT_FOUND: 'CollectionNotFound',

    /** @constant */
    APP_NOT_FOUND: 'AppNotFound',

    /** @constant */
    USER_NOT_FOUND: 'UserNotFound',

    /** @constant */
    BLOB_NOT_FOUND: 'BlobNotFound',

    /** @constant */
    INVALID_CREDENTIALS: 'InvalidCredentials',

    /** @constant */
    KINVEY_INTERNAL_ERROR_RETRY: 'KinveyInternalErrorRetry',

    /** @constant */
    KINVEY_INTERNAL_ERROR_STOP: 'KinveyInternalErrorStop',

    /** @constant */
    USER_ALREADY_EXISTS: 'UserAlreadyExists',

    /** @constant */
    DUPLICATE_END_USERS: 'DuplicateEndUsers',

    /** @constant */
    INSUFFICIENT_CREDENTIALS: 'InsufficientCredentials',

    /** @constant */
    WRITES_TO_COLLECTION_DISALLOWED: 'WritesToCollectionDisallowed',

    /** @constant */
    INDIRECT_COLLECTION_ACCESS_DISALLOWED : 'IndirectCollectionAccessDisallowed',

    /** @constant */
    APP_PROBLEM: 'AppProblem',

    /** @constant */
    PARAMETER_VALUE_OUT_OF_RANGE: 'ParameterValueOutOfRange',

    /** @constant */
    CORS_DISABLED: 'CORSDisabled',

    /** @constant */
    INVALID_QUERY_SYNTAX: 'InvalidQuerySyntax',

    /** @constant */
    MISSING_QUERY: 'MissingQuery',

    /** @constant */
    JSON_PARSE_ERROR: 'JSONParseError',

    /** @constant */
    MISSING_REQUEST_HEADER: 'MissingRequestHeader',

    /** @constant */
    INCOMPLETE_REQUEST_BODY: 'IncompleteRequestBody',

    /** @constant */
    MISSING_REQUEST_PARAMETER: 'MissingRequestParameter',

    /** @constant */
    INVALID_IDENTIFIER: 'InvalidIdentifier',

    /** @constant */
    BAD_REQUEST: 'BadRequest',

    /** @constant */
    FEATURE_UNAVAILABLE: 'FeatureUnavailable',

    /** @constant */
    API_VERSION_NOT_IMPLEMENTED: 'APIVersionNotImplemented',

    /** @constant */
    API_VERSION_NOT_AVAILABLE: 'APIVersionNotAvailable'
  };

}());