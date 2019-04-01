import { ping } from 'kinvey-js-sdk/lib/src/ping';
import { Acl } from 'kinvey-js-sdk/lib/src/acl';
import { Aggregation } from 'kinvey-js-sdk/lib/src/aggregation';
import { collection, DataStoreType } from 'kinvey-js-sdk/lib/src/datastore';
import { endpoint } from 'kinvey-js-sdk/lib/src/endpoint';
import * as Files from 'kinvey-js-sdk/lib/src/files';
import { Kmd } from 'kinvey-js-sdk/lib/src/kmd';
import { Query } from 'kinvey-js-sdk/lib/src/query';
import { getAppVersion, setAppVersion } from 'kinvey-js-sdk/lib/src/http/headers';
import { User } from './user';
import { init, initialize } from './init';
import { StorageProvider } from './storage';

// SDK
export {
  init,
  initialize,
  getAppVersion,
  setAppVersion,

  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // DataStore
  DataStoreType,
  StorageProvider,

  // Files
  Files,

  // Kmd
  Kmd,
  // Metadata: Kmd,

  // Query
  Query,

  // User
  User,

  // Ping
  ping
};

// DataStore
const DataStore = { collection };
export { DataStore };

// Custom Endpoint
const CustomEndpoint = { execute: endpoint };
export { CustomEndpoint };

// User
const AuthorizationGrant = (User as any).AuthorizationGrant;
export { AuthorizationGrant };
