import ActiveUserError from './src/activeUser';
import BaseError from './src/base';
import BLError from './src/bl';
import CORSDisabledError from './src/corsDisabled';
import DuplicateEndUsersError from './src/duplicateEndUsers';
import FeatureUnavailableError from './src/featureUnavailable';
import IncompleteRequestBodyError from './src/incompleteRequestBody';
import IndirectCollectionAccessDisallowedError from './src/indirectCollectionAccessDisallowed';
import InsufficientCredentialsError from './src/insufficientCredentials';
import InvalidCredentialsError from './src/invalidCredentials';
import InvalidIdentifierError from './src/invalidIdentifier';
import InvalidQuerySyntaxError from './src/invalidQuerySyntax';
import JSONParseError from './src/jsonParse';
import KinveyInternalErrorRetry from './src/kinveyInternalErrorRetry';
import KinveyInternalErrorStop from './src/kinveyInternalErrorStop';
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
import StaleRequestError from './src/staleRequest';
import SyncError from './src/sync';
import TimeoutError from './src/timeout';
import UserAlreadyExistsError from './src/userAlreadyExists';
import WritesToCollectionDisallowedError from './src/writesToCollectionDisallowed';

// Export
export {
  ActiveUserError,
  BaseError,
  BLError,
  CORSDisabledError,
  DuplicateEndUsersError,
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  IndirectCollectionAccessDisallowedError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyInternalErrorRetry,
  KinveyInternalErrorStop,
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
  StaleRequestError,
  SyncError,
  TimeoutError,
  UserAlreadyExistsError,
  WritesToCollectionDisallowedError,
};

// Export default
export default KinveyError;
