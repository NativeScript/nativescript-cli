import Acl from './core/acl';
import Aggregation from './core/aggregation';
import { StorageProvider } from './core/datastore/cache/store';
import { DataStoreType } from './core/datastore';
import Query from './core/query';
import { get as getAppVersion, set as setAppVersion } from './core/kinvey/appVersion';
import Kmd from './core/kmd';
import AuthorizationGrant from './core/user/authorizationGrant';

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

export * from './angular/kinvey.module';
export * from './angular/datastore.service';
export * from './angular/endpoint.service';
export * from './angular/files.service';
export * from './angular/ping.service';
export * from './angular/user.service';
