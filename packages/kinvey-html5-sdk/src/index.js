import { Acl } from './acl';
import { Aggregation } from './aggregation';
import * as App from './app';
import * as DataStore from './datastore';
import { User } from './user';
import { Kmd } from './kmd';
import { Query } from './query';
import * as Files from './files';
import { endpoint } from './endpoint';

// SDK
const KinveySDK = {
  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // DataStore
  DataStore,
  DataStoreType: DataStore.DataStoreType,

  // Custom Endpoint
  CustomEndpoint: endpoint,

  // Files
  Files,

  // Kmd
  Kmd,
  Metadata: Kmd,

  // Query
  Query,

  // User
  User,
  AuthorizationGrant: User.AuthorizationGrant
};

// Flatten App onto KinveySDK
Object.keys(App).forEach((key) => {
  KinveySDK[key] = App[key];
});

// Export
module.exports = KinveySDK;
