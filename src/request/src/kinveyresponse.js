import {
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  NotFoundError,
  ParameterValueOutOfRangeError,
  ServerError
} from '../../errors';
import Response, { StatusCode } from './response';

/**
 * @private
 */
export default class KinveyResponse extends Response {
  get error() {
    if (this.isSuccess()) {
      return null;
    }

    const data = this.data || {};
    const name = data.name || data.error;
    const message = data.message || data.description;
    const debug = data.debug;
    const code = this.statusCode;

    if (name === 'FeatureUnavailableError') {
      return new FeatureUnavailableError(message, debug, code);
    } else if (name === 'IncompleteRequestBodyError') {
      return new IncompleteRequestBodyError(message, debug, code);
    } else if (name === 'InsufficientCredentials' || code === StatusCode.Unauthorized) {
      return new InsufficientCredentialsError(message, debug, code);
    } else if (name === 'InvalidCredentials') {
      return new InvalidCredentialsError(message, debug, code);
    } else if (name === 'InvalidIdentifierError') {
      return new InvalidIdentifierError(message, debug, code);
    } else if (name === 'InvalidQuerySyntaxError') {
      return new InvalidQuerySyntaxError(message, debug, code);
    } else if (name === 'JSONParseError') {
      return new JSONParseError(message, debug, code);
    } else if (name === 'MissingQueryError') {
      return new MissingQueryError(message, debug, code);
    } else if (name === 'MissingRequestHeaderError') {
      return new MissingRequestHeaderError(message, debug, code);
    } else if (name === 'MissingRequestParameterError') {
      return new MissingRequestParameterError(message, debug, code);
    } else if (name === 'EntityNotFound'
        || name === 'CollectionNotFound'
        || name === 'AppNotFound'
        || name === 'UserNotFound'
        || name === 'BlobNotFound'
        || name === 'DocumentNotFound'
        || code === StatusCode.NotFound) {
      return new NotFoundError(message, debug, code);
    } else if (name === 'ParameterValueOutOfRangeError') {
      return new ParameterValueOutOfRangeError(message, debug, code);
    } else if (name === 'ServerError'
      || code === StatusCode.ServerError) {
      return new ServerError(message, debug, code);
    }

    return super.error;
  }
}
