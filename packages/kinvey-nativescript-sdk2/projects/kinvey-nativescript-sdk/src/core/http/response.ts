import APIVersionNotAvailableError from '../errors/apiVersionNotAvailable';
import APIVersionNotImplementedError from '../errors/apiVersionNotImplemented';
import AppProblemError from '../errors/appProblem';
import BadRequestError from '../errors/badRequest';
import BLError from '../errors/bl';
import CORSDisabledError from '../errors/corsDisabled';
import DuplicateEndUsersError from '../errors/duplicateEndUsers';
import FeatureUnavailableError from '../errors/featureUnavailable';
import IncompleteRequestBodyError from '../errors/incompleteRequestBody';
import IndirectCollectionAccessDisallowedError from '../errors/indirectCollectionAccessDisallowed';
import InsufficientCredentialsError from '../errors/insufficientCredentials';
import InvalidCredentialsError from '../errors/invalidCredentials';
import InvalidIdentifierError from '../errors/invalidIdentifier';
import InvalidQuerySyntaxError from '../errors/invalidQuerySyntax';
import JSONParseError from '../errors/jsonParse';
import KinveyError from '../errors/kinvey';
import KinveyInternalErrorRetry from '../errors/kinveyInternalErrorRetry';
import KinveyInternalErrorStop from '../errors/kinveyInternalErrorStop';
import MissingQueryError from '../errors/missingQuery';
import MissingRequestHeaderError from '../errors/missingRequestHeader';
import MissingRequestParameterError from '../errors/missingRequestParameter';
import MissingConfigurationError from '../errors/missingConfiguration';
import NetworkConnectionError from '../errors/networkConnection';
import NotFoundError from '../errors/notFound';
import ParameterValueOutOfRangeError from '../errors/parameterValueOutOfRange';
import ResultSetSizeExceededError from '../errors/resultSetSizeExceeded';
import ServerError from '../errors/server';
import StaleRequestError from '../errors/staleRequest';
import TimeoutError from '../errors/timeout';
import UserAlreadyExistsError from '../errors/userAlreadyExists';
import WritesToCollectionDisallowedError from '../errors/writesToCollectionDisallowed';
import { Headers } from './headers';
import { parse } from './utils';

const StatusCode = {
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

export default class Response {
  public statusCode: number;
  public headers: Headers;
  public data: any;

  constructor(response) {
    this.statusCode = response.statusCode;
    this.headers = new Headers(response.headers);
    this.data = parse(this.headers.contentType, response.data);
  }

  get error() {
    if (!this.isSuccess()) {
      const data = this.data || {};
      const name = data.name || data.error;
      const message = data.message || data.description;
      const debug = data.debug;
      const code = this.statusCode;
      const kinveyRequestId = this.headers.get('X-Kinvey-Request-ID');

      if (name === 'APIVersionNotAvailable') {
        return new APIVersionNotAvailableError(message, debug, code, kinveyRequestId);
      } else if (name === 'APIVersionNotImplemented') {
        return new APIVersionNotImplementedError(message, debug, code, kinveyRequestId);
      } else if (name === 'AppProblem') {
        return new AppProblemError(message, debug, code, kinveyRequestId);
      } else if (name === 'AppProblem') {
        return new AppProblemError(message, debug, code, kinveyRequestId);
      } else if (name === 'BadRequest') {
        return new BadRequestError(message, debug, code, kinveyRequestId);
      } else if (name === 'BLInternalError'
        || name === 'BLRuntimeError'
        || name === 'BLSyntaxError'
        || name === 'BLTimeoutError'
        || name === 'BLViolationError') {
        return new BLError(message, debug, code, kinveyRequestId);
      } else if (name === 'CORSDisabled') {
        return new CORSDisabledError(message, debug, code, kinveyRequestId);
      } else if (name === 'DuplicateEndUsers') {
        return new DuplicateEndUsersError(message, debug, code, kinveyRequestId);
      } else if (name === 'FeatureUnavailable') {
        return new FeatureUnavailableError(message, debug, code, kinveyRequestId);
      } else if (name === 'IncompleteRequestBody') {
        return new IncompleteRequestBodyError(message, debug, code, kinveyRequestId);
      } else if (name === 'IndirectCollectionAccessDisallowed') {
        return new IndirectCollectionAccessDisallowedError(message, debug, code, kinveyRequestId);
      } else if (name === 'InsufficientCredentials') {
        return new InsufficientCredentialsError(message, debug, code, kinveyRequestId);
      } else if (name === 'InvalidCredentials') {
        return new InvalidCredentialsError(message, debug, code, kinveyRequestId);
      } else if (name === 'InvalidIdentifier') {
        return new InvalidIdentifierError(message, debug, code, kinveyRequestId);
      } else if (name === 'InvalidQuerySyntax') {
        return new InvalidQuerySyntaxError(message, debug, code, kinveyRequestId);
      } else if (name === 'JSONParseError') {
        return new JSONParseError(message, debug, code, kinveyRequestId);
      } else if (name === 'KinveyInternalErrorRetry') {
        return new KinveyInternalErrorRetry(message, debug, code, kinveyRequestId);
      } else if (name === 'KinveyInternalErrorStop') {
        return new KinveyInternalErrorStop(message, debug, code, kinveyRequestId);
      } else if (name === 'MissingQuery') {
        return new MissingQueryError(message, debug, code, kinveyRequestId);
      } else if (name === 'MissingRequestHeader') {
        return new MissingRequestHeaderError(message, debug, code, kinveyRequestId);
      } else if (name === 'MissingRequestParameter') {
        return new MissingRequestParameterError(message, debug, code, kinveyRequestId);
      } else if (name === 'MissingConfiguration') {
        return new MissingConfigurationError(message, debug, code, kinveyRequestId);
      } else if (name === 'EntityNotFound'
        || name === 'CollectionNotFound'
        || name === 'AppNotFound'
        || name === 'UserNotFound'
        || name === 'BlobNotFound'
        || name === 'DocumentNotFound') {
        return new NotFoundError(message, debug, code, kinveyRequestId);
      } else if (name === 'ParameterValueOutOfRange') {
        return new ParameterValueOutOfRangeError(message, debug, code, kinveyRequestId);
      } else if (name === 'ResultSetSizeExceeded') {
        return new ResultSetSizeExceededError(message, debug, code, kinveyRequestId);
      } else if (name === 'ServerError') {
        return new ServerError(message, debug, code, kinveyRequestId);
      } else if (name === 'StaleRequest') {
        return new StaleRequestError(message, debug, code, kinveyRequestId);
      } else if (name === 'UserAlreadyExists') {
        return new UserAlreadyExistsError(message, debug, code, kinveyRequestId);
      } else if (name === 'WritesToCollectionDisallowed') {
        return new WritesToCollectionDisallowedError(message, debug, code, kinveyRequestId);
      } else if (code === StatusCode.Unauthorized
        || code === StatusCode.Forbidden) {
        return new InsufficientCredentialsError(message, debug, code, kinveyRequestId);
      } else if (code === StatusCode.NotFound) {
        return new NotFoundError(message, debug, code, kinveyRequestId);
      } else if (code === StatusCode.ServerError) {
        return new ServerError(message, debug, code, kinveyRequestId);
      }

      return new KinveyError(message, debug, code, kinveyRequestId);
    }

    return null;
  }

  isSuccess() {
    return (this.statusCode >= 200 && this.statusCode < 300)
      || this.statusCode === StatusCode.MovedPermanently
      || this.statusCode === StatusCode.Found
      || this.statusCode === StatusCode.NotModified
      || this.statusCode === StatusCode.TemporaryRedirect
      || this.statusCode === StatusCode.PermanentRedirect;
  }
}
