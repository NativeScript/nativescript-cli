import Acl from './acl';
import { StorageProvider } from './datastore/cache/store';
import * as DataStore from './datastore';
import Kmd from './kmd';
import Query from './query';
import * as Files from './files';
import endpoint from './endpoint';
import Aggregation from './aggregation';
import init from './kinvey/init';
import initialize from './kinvey/initialize';
import { get as getAppVersion, set as setAppVersion } from './kinvey/appVersion';
import User from './user';
import ping from './ping';

// SDK
const SDK = {
  init,
  initialize,
  getAppVersion,
  setAppVersion,

  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // DataStore
  DataStore,
  DataStoreType: DataStore.DataStoreType,
  StorageProvider,

  // Custom Endpoint
  CustomEndpoint: { execute: endpoint },

  // Files
  Files,

  // Kmd
  Kmd,
  Metadata: Kmd,

  // Query
  Query,

  // User
  User,
  AuthorizationGrant: User.AuthorizationGrant,

  // Ping
  ping
};

// Export
module.exports = SDK;
