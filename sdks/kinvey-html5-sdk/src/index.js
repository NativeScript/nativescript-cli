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
const SDK = {
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

// Flatten App onto SDK
Object.keys(App).forEach((key) => {
  SDK[key] = App[key];
});

// Export
module.exports = SDK;
