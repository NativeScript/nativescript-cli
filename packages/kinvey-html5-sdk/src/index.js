import { Acl } from './acl';
import { Aggregation } from './aggregation';
import * as App from './app';
import * as DataStore from './datastore';
import { User } from './user';
import { Kmd } from './kmd';
import { Query } from './query';

// SDK
const KinveySDK = {
  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // DataStore
  DataStore,
  DataStoreType: DataStore.DataStoreType,

  // Kmd
  Kmd,

  // Query
  Query,

  // User
  User
};

// Flatten App onto KinveySDK
Object.keys(App).forEach((key) => {
  KinveySDK[key] = App[key];
});

// Export
module.exports = KinveySDK;
