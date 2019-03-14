import Acl from '../acl';
import Aggregation from '../aggregation';
import { StorageProvider } from '../datastore/cache/store';
import { DataStoreType } from '../datastore';
import Query from '../query';
import { get as getAppVersion, set as setAppVersion } from '../kinvey/appVersion';
import Kmd from '../kmd';
import AuthorizationGrant from '../user/authorizationGrant';
import DataStoreService from './datastore';
import EndpointService from './endpoint';
import FilesService from './files';
import KinveyModule from './kinvey';
import PingService from './ping';
import UserService from './user';
import PushService from './push.service';

export {
  // Kinvey
  KinveyModule,

  // App Version
  getAppVersion,
  setAppVersion,

  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // DataStore
  StorageProvider,
  DataStoreType,
  DataStoreService,

  // Custom Endpoint
  EndpointService,

  // Files
  FilesService,

  // Kmd
  Kmd,
  Kmd as Metadata,

  // Query
  Query,

  // User
  AuthorizationGrant,
  UserService,

  // Ping
  PingService,

  // Push
  PushService
};
