import Acl from '../acl';
import Aggregation from '../aggregation';
import { StorageProvider } from '../datastore/cache/store';
import { DataStoreType } from '../datastore';
import Query from '../query';
import { get as getAppVersion, set as setAppVersion } from '../kinvey/appVersion';
import Kmd from '../kmd';
import AuthorizationGrant from '../user/authorizationGrant';

export {
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

  // Kmd
  Kmd,
  Kmd as Metadata,

  // Query
  Query,

  // User
  AuthorizationGrant
};

export * from './kinvey.module';
export * from './datastore.service';
export * from './endpoint.service';
export * from './files.service';
export * from './ping.service';
export * from './user.service';
