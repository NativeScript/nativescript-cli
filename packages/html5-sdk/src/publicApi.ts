import { ping } from 'kinvey-js-sdk/lib/ping';
import { Acl } from 'kinvey-js-sdk/lib/acl';
import { Aggregation } from 'kinvey-js-sdk/lib/aggregation';
import { collection, DataStoreType } from 'kinvey-js-sdk/lib/datastore';
import { endpoint } from 'kinvey-js-sdk/lib/endpoint';
import * as Files from 'kinvey-js-sdk/lib/files';
import { Kmd } from 'kinvey-js-sdk/lib/kmd';
import { Query } from 'kinvey-js-sdk/lib/query';
import { User } from 'kinvey-js-sdk/lib/user';
import { getAppVersion, setAppVersion } from 'kinvey-js-sdk/lib/http/headers';
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
