import { NetworkRack, CacheRack } from '../../../src/core/request';
import { Html5HttpMiddleware } from '../../../src/html5/http';
import { Html5CacheMiddleware } from '../../../src/html5/cache';
import { MobileIdentityConnect } from '../../../src/core/identity';
import { Popup } from '../../../src/phonegap/popup';
import { Push } from '../../../src/phonegap/push';
import pkg from '../package.json';

// Setup racks
CacheRack.useCacheMiddleware(new Html5CacheMiddleware());
NetworkRack.useHttpMiddleware(new Html5HttpMiddleware(pkg));

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

export {
  client,
  getAppVersion,
  setAppVersion,
  ping,
  Acl,
  Aggregation,
  AuthorizationGrant,
  CustomEndpoint,
  DataStore,
  DataStoreType,
  SyncOperation,
  LiveService,
  Files,
  Log,
  Metadata,
  Query,
  User,

  ActiveUserError,
  APIVersionNotAvailableError,
  APIVersionNotImplementedError,
  AppProblemError,
  BadRequestError,
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
  KinveyError,
  KinveyInternalErrorRetry,
  KinveyInternalErrorStop,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  MobileIdentityConnectError,
  NoActiveUserError,
  NetworkConnectionError,
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
  WritesToCollectionDisallowedError
} from '../../../src/core';
export * from '../../../src/html5';
export { Push } from '../../../src/phonegap/push';
