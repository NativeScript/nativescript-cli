import {
  getAppVersion,
  setAppVersion,
  ping,
  Acl,
  Aggregation,
  collection, DataStoreType,
  endpoint,
  Files,
  Kmd,
  Query,
  User
} from 'kinvey-js-sdk';
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
