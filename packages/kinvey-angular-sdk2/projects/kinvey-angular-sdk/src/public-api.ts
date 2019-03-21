/*
 * Public API Surface of kinvey-angular-sdk
 */

import Acl from './lib/acl';
import Aggregation from './lib/aggregation';
import { StorageProvider } from './lib/datastore/cache/store';
import { DataStoreType } from './lib/datastore';
import Query from './lib/query';
import { get as getAppVersion, set as setAppVersion } from './lib/kinvey/appVersion';
import Kmd from './lib/kmd';
import AuthorizationGrant from './lib/user/authorizationGrant';

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

export * from './lib/angular/kinvey.module';
export * from './lib/angular/datastore.service';
export * from './lib/angular/endpoint.service';
export * from './lib/angular/files.service';
export * from './lib/angular/ping.service';
export * from './lib/angular/user.service';
