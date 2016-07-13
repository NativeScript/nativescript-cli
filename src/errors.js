import ExtendableError from 'es6-error';

export class KinveyError extends ExtendableError {
  constructor(message = 'An error has occurred.', debug = '', code = -1) {
    super(message);
    this.debug = debug;
    this.code = code;
  }
}

export class ActiveUserError extends KinveyError {
  constructor(message = 'An active user already exists.', debug, code) {
    super(message, debug, code);
  }
}

export class FeatureUnavailableError extends KinveyError {
  constructor(message = 'Requested functionality is unavailable in this API version.', debug, code) {
    super(message, debug, code);
  }
}

export class IncompleteRequestBodyError extends KinveyError {
  constructor(message = ' The request body is either missing or incomplete.', debug, code) {
    super(message, debug, code);
  }
}

export class InsufficientCredentialsError extends KinveyError {
  constructor(message = 'The credentials used to authenticate this request are not authorized to run ' +
    'this operation. Please retry your request with appropriate credentials.', debug, code) {
    super(message, debug, code);
  }
}

export class InvalidCredentialsError extends KinveyError {
  constructor(message = ' Invalid credentials. Please retry your request with correct credentials.', debug, code) {
    super(message, debug, code);
  }
}

export class InvalidIdentifierError extends KinveyError {
  constructor(message = 'One of more identifier names in the request has an invalid format.', debug, code) {
    super(message, debug, code);
  }
}

export class InvalidQuerySyntaxError extends KinveyError {
  constructor(message = 'The query string in the request has an invalid syntax.', debug, code) {
    super(message, debug, code);
  }
}

export class JSONParseError extends KinveyError {
  constructor(message = 'Unable to parse the JSON in the request.', debug, code) {
    super(message, debug, code);
  }
}

export class MissingQueryError extends KinveyError {
  constructor(message = 'The request is missing a query string.', debug, code) {
    super(message, debug, code);
  }
}

export class MissingRequestHeaderError extends KinveyError {
  constructor(message = 'The request is missing a required header.', debug, code) {
    super(message, debug, code);
  }
}

export class MissingRequestParameterError extends KinveyError {
  constructor(message = 'A required parameter is missing from the request.', debug, code) {
    super(message, debug, code);
  }
}

export class NoNetworkConnectionError extends KinveyError {
  constructor(message = 'You do not have a network connect.', debug, code) {
    super(message, debug, code);
  }
}

export class NoActiveUserError extends KinveyError {
  constructor(message = 'There is not an active user.', debug, code) {
    super(message, debug, code);
  }
}

export class NotFoundError extends KinveyError {
  constructor(message = 'The item was not found.', debug, code) {
    super(message, debug, code);
  }
}

export class NoResponseError extends KinveyError {
  constructor(message = 'No response was provided.', debug, code) {
    super(message, debug, code);
  }
}

export class ParameterValueOutOfRangeError extends KinveyError {
  constructor(message = 'The value specified for one of the request parameters is out of range.', debug, code) {
    super(message, debug, code);
  }
}

export class QueryError extends KinveyError {
  constructor(message = 'An error occurred on the query.', debug) {
    super(message, debug);
  }
}

export class ServerError extends KinveyError {
  constructor(message = 'An error occurred on the server', debug) {
    super(message, debug);
  }
}

export class SyncError extends KinveyError {
  constructor(message = 'An error occurred during sync', debug, code) {
    super(message, debug, code);
  }
}
