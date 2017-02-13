import ActiveUserError from './src/activeUser';
import BaseError from './src/base';
import FeatureUnavailableError from './src/featureUnavailable';
import IncompleteRequestBodyError from './src/incompleteRequestBody';
import InsufficientCredentialsError from './src/insufficientCredentials';
import InvalidCredentialsError from './src/invalidCredentials';
import InvalidIdentifierError from './src/invalidIdentifier';
import InvalidQuerySyntaxError from './src/invalidQuerySyntax';
import JSONParseError from './src/jsonParse';
import KinveyError from './src/kinvey';
import MissingQueryError from './src/missingQuery';
import MissingRequestHeaderError from './src/missingRequestHeader';
import MissingRequestParameterError from './src/missingRequestParameter';
import MobileIdentityConnectError from './src/mobileIdentityConnect';
import NoActiveUserError from './src/noActiveUser';
import NoNetworkConnectionError from './src/noNetworkConnection';
import NoResponseError from './src/noResponse';
import NotFoundError from './src/notFound';
import ParameterValueOutOfRangeError from './src/parameterValueOutOfRange';
import PopupError from './src/popup';
import QueryError from './src/query';
import ServerError from './src/server';
import SyncError from './src/sync';
import TimeoutError from './src/timeout';

// Export
export {
  ActiveUserError,
  BaseError,
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyError,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  MobileIdentityConnectError,
  NoActiveUserError,
  NoNetworkConnectionError,
  NoResponseError,
  NotFoundError,
  ParameterValueOutOfRangeError,
  PopupError,
  QueryError,
  ServerError,
  SyncError,
  TimeoutError
};

// Export default
export default KinveyError;
