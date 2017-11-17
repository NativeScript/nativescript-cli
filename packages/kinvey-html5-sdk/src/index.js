const { client, getAppVersion, setAppVersion, init, initialize, ping } = require('kinvey-html5');
const { Acl } = require('kinvey-acl');
const { Aggregation } = require('kinvey-aggregation');
const { AuthorizationGrant } = require('kinvey-identity');
const { CustomEndpoint } = require('kinvey-endpoint');
const { DataStore, DataStoreType, SyncOperation } = require('kinvey-datastore');
const LiveService = require('kinvey-live');
const { Files } = require('kinvey-filestore');
const { Log } = require('kinvey-log');
const { Metadata } = require('kinvey-metadata');
const { Query } = require('kinvey-query');
const { User } = require('kinvey-user');
const {
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
} = require('kinvey-errors');
const { CacheRack, NetworkRack } = require('kinvey-request');
const { MobileIdentityConnect } = require('kinvey-identity');
const { CacheMiddleware } = require('kinvey-html5-cache');
const { HttpMiddleware } = require('kinvey-html5-http');
const { Popup } = require('kinvey-html5-popup');
const pkg = require('../package.json');

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware(pkg));

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

module.exports = {
  client,
  getAppVersion,
  setAppVersion,
  init,
  initialize,
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
};
