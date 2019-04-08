import isString from 'lodash/isString';
import { APIVersionNotAvailableError } from '../errors/apiVersionNotAvailable';
import { APIVersionNotImplementedError } from '../errors/apiVersionNotImplemented';
import { AppProblemError } from '../errors/appProblem';
import { BadRequestError } from '../errors/badRequest';
import { BLError } from '../errors/bl';
import { CORSDisabledError } from '../errors/corsDisabled';
import { DuplicateEndUsersError } from '../errors/duplicateEndUsers';
import { FeatureUnavailableError } from '../errors/featureUnavailable';
import { IncompleteRequestBodyError } from '../errors/incompleteRequestBody';
import { IndirectCollectionAccessDisallowedError } from '../errors/indirectCollectionAccessDisallowed';
import { InsufficientCredentialsError } from '../errors/insufficientCredentials';
import { InvalidCredentialsError } from '../errors/invalidCredentials';
import { InvalidIdentifierError } from '../errors/invalidIdentifier';
import { InvalidQuerySyntaxError } from '../errors/invalidQuerySyntax';
import { JSONParseError } from '../errors/jsonParse';
import { KinveyError } from '../errors/kinvey';
import { KinveyInternalErrorRetry } from '../errors/kinveyInternalErrorRetry';
import { KinveyInternalErrorStop } from '../errors/kinveyInternalErrorStop';
import { MissingQueryError } from '../errors/missingQuery';
import { MissingRequestHeaderError } from '../errors/missingRequestHeader';
import { MissingRequestParameterError } from '../errors/missingRequestParameter';
import { MissingConfigurationError } from '../errors/missingConfiguration';
import { NotFoundError } from '../errors/notFound';
import { ParameterValueOutOfRangeError } from '../errors/parameterValueOutOfRange';
import { ResultSetSizeExceededError } from '../errors/resultSetSizeExceeded';
import { ServerError } from '../errors/server';
import { StaleRequestError } from '../errors/staleRequest';
import { UserAlreadyExistsError } from '../errors/userAlreadyExists';
import { WritesToCollectionDisallowedError } from '../errors/writesToCollectionDisallowed';
import { HttpHeaders } from './headers';

export enum HttpStatusCode {
  Ok = 200,
  Created = 201,
  Empty = 204,
  MovedPermanently = 301,
  Found = 302,
  NotModified = 304,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  ServerError = 500
}

export interface HttpResponseConfig {
  statusCode: HttpStatusCode;
  headers: HttpHeaders;
  data?: string;
}

export class HttpResponse {
  public statusCode: HttpStatusCode;
  public headers: HttpHeaders;
  public data?: any;

  constructor(config: HttpResponseConfig) {
    this.statusCode = config.statusCode;
    this.headers = new HttpHeaders(config.headers);

    const contentType = this.headers.get('Content-Type') || '';
    if (isString(config.data) && contentType.indexOf('application/json') !== -1) {
      this.data = JSON.parse(config.data);
    } else {
      this.data = config.data;
    }
  }

  get error() {
    if (!this.isSuccess()) {
      const message = this.data.message || this.data.description;
      const name = this.data.name || this.data.error;

      if (name === 'APIVersionNotAvailable') {
        return new APIVersionNotAvailableError(message);
      } else if (name === 'APIVersionNotImplemented') {
        return new APIVersionNotImplementedError(message);
      } else if (name === 'AppProblem') {
        return new AppProblemError(message);
      } else if (name === 'AppProblem') {
        return new AppProblemError(message);
      } else if (name === 'BadRequest') {
        return new BadRequestError(message);
      } else if (name === 'BLInternalError'
        || name === 'BLRuntimeError'
        || name === 'BLSyntaxError'
        || name === 'BLTimeoutError'
        || name === 'BLViolationError') {
        return new BLError(message);
      } else if (name === 'CORSDisabled') {
        return new CORSDisabledError(message);
      } else if (name === 'DuplicateEndUsers') {
        return new DuplicateEndUsersError(message);
      } else if (name === 'FeatureUnavailable') {
        return new FeatureUnavailableError(message);
      } else if (name === 'IncompleteRequestBody') {
        return new IncompleteRequestBodyError(message);
      } else if (name === 'IndirectCollectionAccessDisallowed') {
        return new IndirectCollectionAccessDisallowedError(message);
      } else if (name === 'InsufficientCredentials') {
        return new InsufficientCredentialsError(message);
      } else if (name === 'InvalidCredentials') {
        return new InvalidCredentialsError(message);
      } else if (name === 'InvalidIdentifier') {
        return new InvalidIdentifierError(message);
      } else if (name === 'InvalidQuerySyntax') {
        return new InvalidQuerySyntaxError(message);
      } else if (name === 'JSONParseError') {
        return new JSONParseError(message);
      } else if (name === 'KinveyInternalErrorRetry') {
        return new KinveyInternalErrorRetry(message);
      } else if (name === 'KinveyInternalErrorStop') {
        return new KinveyInternalErrorStop(message);
      } else if (name === 'MissingQuery') {
        return new MissingQueryError(message);
      } else if (name === 'MissingRequestHeader') {
        return new MissingRequestHeaderError(message);
      } else if (name === 'MissingRequestParameter') {
        return new MissingRequestParameterError(message);
      } else if (name === 'MissingConfiguration') {
        return new MissingConfigurationError(message);
      } else if (name === 'EntityNotFound'
        || name === 'CollectionNotFound'
        || name === 'AppNotFound'
        || name === 'UserNotFound'
        || name === 'BlobNotFound'
        || name === 'DocumentNotFound') {
        return new NotFoundError(message);
      } else if (name === 'ParameterValueOutOfRange') {
        return new ParameterValueOutOfRangeError(message);
      } else if (name === 'ResultSetSizeExceeded') {
        return new ResultSetSizeExceededError(message);
      } else if (name === 'ServerError') {
        return new ServerError(message);
      } else if (name === 'StaleRequest') {
        return new StaleRequestError(message);
      } else if (name === 'UserAlreadyExists') {
        return new UserAlreadyExistsError(message);
      } else if (name === 'WritesToCollectionDisallowed') {
        return new WritesToCollectionDisallowedError(message);
      } else if (this.statusCode === HttpStatusCode.Unauthorized
        || this.statusCode === HttpStatusCode.Forbidden) {
        return new InsufficientCredentialsError(message);
      } else if (this.statusCode === HttpStatusCode.NotFound) {
        return new NotFoundError(message);
      } else if (this.statusCode === HttpStatusCode.ServerError) {
        return new ServerError(message);
      }

      return new KinveyError(message);
    }

    return null;
  }

  isSuccess() {
    return (this.statusCode >= 200 && this.statusCode < 300)
      || this.statusCode === HttpStatusCode.MovedPermanently
      || this.statusCode === HttpStatusCode.Found
      || this.statusCode === HttpStatusCode.NotModified
      || this.statusCode === HttpStatusCode.TemporaryRedirect
      || this.statusCode === HttpStatusCode.PermanentRedirect;
  }
}
